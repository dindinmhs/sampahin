import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from '@google/genai';
import { functionDefinitions } from '@/lib/ai-agent/definitions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket;
}

interface RAGResult {
  report_id: string;
  location_id: string;
  location_name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  grade: string;
  score: number;
  ai_description: string;
  lan: number;
  lat: number;
  img_url: string;
  type: string;
  similarity_score: number;
  text_similarity?: number;
  image_similarity?: number;
}

interface StreamSession {
  session: Session;
  responseQueue: LiveServerMessage[];
  isProcessing: boolean;
}

// Global session storage
const activeSessions = new Map<string, StreamSession>();
const pendingRequests = new Map<string, {
  query: string;
  imageBase64?: string;
  ragResults?: RAGResult[];
  userLocation?: [number, number];
}>();

// POST - Initialize session with data
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || Math.random().toString(36);
    
    const body = await request.json();
    const { query, imageBase64, ragResults, userLocation } = body;

    pendingRequests.set(sessionId, {
      query,
      imageBase64,
      ragResults,
      userLocation
    });

    console.log(`📝 Stored request data for session: ${sessionId}`);

    return Response.json({ 
      success: true, 
      sessionId,
      message: 'Request queued for streaming' 
    });

  } catch (error) {
    console.error('❌ POST Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Stream the response
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'Session ID required' }, { status: 400 });
  }

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Wait for request data
        let requestData = pendingRequests.get(sessionId);
        let attempts = 0;
        
        while (!requestData && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          requestData = pendingRequests.get(sessionId);
          attempts++;
        }

        if (!requestData) {
          sendSSE(controller, encoder, { 
            type: 'error', 
            error: 'Request data not found or timeout' 
          });
          controller.close();
          return;
        }

        const { query, imageBase64, ragResults, userLocation } = requestData;
        pendingRequests.delete(sessionId);

        console.log(`🚀 Starting AI session for: ${sessionId}`);

        // Initialize AI session
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY || '',
        });

        const model = 'models/gemini-2.5-flash-live-preview';
        const tools = [{ functionDeclarations: functionDefinitions }];

        const sessionConfig = {
          responseModalities: [Modality.AUDIO], // ✅ AUDIO only for function calls
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          speechConfig: {
                languageCode: 'id-ID',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
            },
          tools, // ✅ ENABLE tools
          systemInstruction: buildSystemPrompt(ragResults, userLocation),
          contextWindowCompression: {
            triggerTokens: '25600',
            slidingWindow: { targetTokens: '12800' },
          },
        };

        const responseQueue: LiveServerMessage[] = [];

        const session = await ai.live.connect({
          model,
          callbacks: {
            onopen: () => {
              console.log('✅ AI Agent session opened');
              sendSSE(controller, encoder, { type: 'connected' });
            },
            onmessage: (message: LiveServerMessage) => {
            //   console.log('📨 Message received from Gemini');
              responseQueue.push(message);
            },
            onerror: (e: ErrorEvent) => {
              console.error('❌ AI Agent error:', e.message);
              sendSSE(controller, encoder, { type: 'error', error: e.message });
            },
            onclose: (e: CloseEvent) => {
              console.log('🔒 AI Agent session closed:', e.reason);
            },
          },
          config: sessionConfig
        });

        // Store session
        activeSessions.set(sessionId, {
          session,
          responseQueue,
          isProcessing: false,
        });

        // Build and send prompt
        const ragContext = buildRAGContext(ragResults);
        let fullPrompt = `${ragContext}\n\nUser Query: ${query}`;
        
        if (imageBase64) {
          await session.sendClientContent({
            turns: [{
              role: 'user',
              parts: [
                { text: fullPrompt },
                { 
                  inlineData: { 
                    mimeType: 'image/jpeg',
                    data: imageBase64 
                  } 
                }
              ]
            }]
          });
        } else {
          await session.sendClientContent({ turns: [fullPrompt] });
        }

        console.log('📤 Prompt sent, waiting for response...');

        // ✅ Process messages like maps-ai-agent.ts
        await handleTurn(sessionId, controller, encoder);

        // Send complete and cleanup
        sendSSE(controller, encoder, { type: 'complete' });
        session.close();
        activeSessions.delete(sessionId);

      } catch (error) {
        console.error('❌ Error initializing AI session:', error);
        sendSSE(controller, encoder, { 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      } finally {
        controller.close();
      }
    },

    cancel() {
      console.log(`🧹 Cleaning up session: ${sessionId}`);
      const sessionData = activeSessions.get(sessionId);
      if (sessionData) {
        sessionData.session.close();
        activeSessions.delete(sessionId);
      }
      pendingRequests.delete(sessionId);
    }
  });

  return new Response(stream, { headers });
}

// ✅ LIKE maps-ai-agent.ts - handle turn with real-time processing
async function handleTurn(
  sessionId: string, 
  controller: ReadableStreamDefaultController, 
  encoder: TextEncoder
) {
  const sessionData = activeSessions.get(sessionId);
  if (!sessionData) return;

  sessionData.isProcessing = true;
  let done = false;
  let messageCount = 0;

  console.log('⏳ Starting to handle turn...');

  while (!done) {
    const message = await waitMessage(sessionId);
    if (!message) {
      console.log('⚠️ No more messages');
      break;
    }

    messageCount++;
    // console.log(`📨 Processing message ${messageCount}`);

    // ✅ Process message IMMEDIATELY (like maps-ai-agent.ts)
    await handleModelTurn(message, sessionId, controller, encoder);

    // Check if turn is complete
    if (message.serverContent?.turnComplete) {
    //   console.log('🏁 Turn complete detected');
      done = true;
    }
  }

  sessionData.isProcessing = false;
  console.log(`✅ Turn complete (${messageCount} messages processed)`);
}

async function waitMessage(sessionId: string): Promise<LiveServerMessage | null> {
  const sessionData = activeSessions.get(sessionId);
  if (!sessionData) return null;

  let message: LiveServerMessage | undefined;
  let attempts = 0;
  
  while (!message && attempts < 100) {
    message = sessionData.responseQueue.shift();
    if (!message) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }
  
  return message || null;
}

// ✅ CRITICAL: Process IMMEDIATELY like maps-ai-agent.ts
async function handleModelTurn(
  message: LiveServerMessage, 
  sessionId: string, 
  controller: ReadableStreamDefaultController, 
  encoder: TextEncoder
) {
  const sessionData = activeSessions.get(sessionId);
  if (!sessionData) return;

//   console.log('📨 Processing message:', {
//     hasToolCall: !!message.toolCall,
//     hasServerContent: !!message.serverContent,
//   });

  // ✅ 1. Handle function calls IMMEDIATELY and SEND TO FRONTEND
  if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
    console.log(`🔧 Received ${message.toolCall.functionCalls.length} function calls`);
    
    const functionCalls = message.toolCall.functionCalls.map(fc => ({
      name: fc.name ?? '',
      args: fc.args,
      id: fc.id ?? ''
    }));

    // ✅ SEND IMMEDIATELY TO FRONTEND (don't wait for turn complete)
    console.log('📤 Sending function calls to frontend NOW:', functionCalls);
    sendSSE(controller, encoder, {
      type: 'functionCalls',
      functionCalls: functionCalls
    });

    // Send tool response back to Gemini
    await sessionData.session.sendToolResponse({
      functionResponses: message.toolCall.functionCalls.map(fc => ({
        id: fc.id,
        name: fc.name,
        response: { success: true, message: 'Function executed on frontend' }
      }))
    });

    console.log('✅ Tool response sent back to Gemini');
  }

  // ✅ 2. Handle content (audio and text)
  if (message.serverContent?.modelTurn?.parts) {
    for (const part of message.serverContent.modelTurn.parts) {
      // Handle audio
      if (part?.inlineData) {
        const audioData = part.inlineData.data ?? '';
        
        if (audioData.length > 0) {
        //   console.log('🎵 Streaming audio chunk, size:', audioData.length);
          sendSSE(controller, encoder, {
            type: 'audioChunk',
            data: audioData,
            mimeType: part.inlineData.mimeType ?? 'audio/pcm'
          });
        }
      }

      // Handle text
      if (part?.text) {
        console.log('💬 Text response:', part.text.substring(0, 100));
        sendSSE(controller, encoder, {
          type: 'text',
          text: part.text
        });
      }
    }
  }
}

function sendSSE(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: any) {
  try {
    if (controller.desiredSize === null) {
      console.log('⚠️ Controller already closed');
      return;
    }
    
    const sseData = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(sseData));
  } catch (error) {
    console.log('⚠️ Error sending SSE:', error instanceof Error ? error.message : 'Unknown');
  }
}

function buildRAGContext(ragResults?: RAGResult[]): string {
  if (!ragResults || ragResults.length === 0) {
    return "Tidak ada data lokasi yang relevan ditemukan.";
  }
  
  let context = `Data lokasi yang relevan berdasarkan pencarian:\n\n`;
  
  ragResults.forEach((result, index) => {
    context += `${index + 1}. **${result.location_name}**\n`;
    context += `   - ID: ${result.location_id}\n`;
    context += `   - Alamat: ${result.address}, ${result.city}\n`;
    context += `   - Grade: ${result.grade} (Skor: ${result.score}/100)\n`;
    context += `   - Deskripsi: ${result.ai_description}\n\n`;
  });
  
  return context;
}

function buildSystemPrompt(ragResults?: RAGResult[], userLocation?: [number, number]): string {
  const userLocationInfo = userLocation 
    ? `Lokasi user saat ini: [${userLocation[0]}, ${userLocation[1]}]` 
    : "Lokasi user tidak diketahui";

  return `# Sampahin AI Assistant - Voice & Function Interface

## CRITICAL INSTRUCTIONS:
1. ALWAYS provide conversational audio response in Indonesian first
2. Call appropriate functions DURING or AFTER your explanation
3. Function calls can happen at any time during conversation
4. Explain what you're showing while calling the functions
5. LANGSUNG GUNAKAN DATA RAG - Jangan tanya tempat apa yang dimaksud
6. WAJIB gunakan function calls untuk interaksi map

## Your Identity:
Voice assistant untuk aplikasi Sampahin - monitoring kebersihan lingkungan Indonesia.

## Context:
${userLocationInfo}

## RESPONSE STRATEGY - NATURAL CONVERSATION:
1. **Start with conversational audio explanation**
2. **Call functions WHILE explaining** 
3. **Continue explaining what the user will see**

## RAG DATA USAGE RULES:
- JIKA ada data RAG dengan similarity_score > 0.3, LANGSUNG gunakan data tersebut
- JANGAN tanya "tempat apa yang dimaksud" atau "lokasi mana yang Anda maksud"
- PRIORITAS: text_similarity dan image_similarity yang tinggi = jawaban yang tepat
- UNTUK GAMBAR: Similarity > 0.4 = PASTI benar, langsung gunakan
- UNTUK TEKS: Similarity > 0.5 = PASTI benar, langsung gunakan
- Jika ada multiple results, pilih yang similarity tertinggi

## FUNCTION CALL MAPPING:

### User wants location details:
- Keywords: "detail", "info", "tampilkan", "lihat", "buka", "informasi", "tunjukkan"
- Example Flow:
  * Audio: "Baik, saya akan menampilkan detail lokasi [nama]..."
  * THEN CALL: show_location_details(location_id_from_RAG, focus_map: true)
  * Audio continues: "...yang berada di [alamat] dengan grade [grade]."

### User wants navigation:
- Keywords: "rute", "arah", "navigasi", "jalan", "pergi ke", "carikan jalan"
- Example Flow:
  * Audio: "Saya akan carikan rute ke [nama lokasi]..."
  * THEN CALL: navigate_to_location(location_id_from_RAG, transport_mode: "driving")
  * Audio continues: "...di [alamat]. Navigasi sudah dimulai."

### User wants to see/highlight locations:
- Keywords: "tunjukkan", "sorot", "highlight", "tampilkan di peta", "yang ada di"
- Example Flow:
  * Audio: "Saya akan sorot [jumlah] lokasi..."
  * THEN CALL: highlight_locations([location_ids_from_RAG], highlight_type: "pulse")
  * Audio continues: "...sekarang terlihat di peta."

### User asks filter/nearby:
- Use set_map_filter() or find_nearby_locations() accordingly

## EXAMPLES:

**Input**: "Tampilkan detail Tasik"
**Response Flow**:
1. Audio starts: "Baik, saya akan menampilkan detail Tasik untuk Anda..."
2. CALL: show_location_details("TASIK_001", true)
3. Audio continues: "...lokasi ini berada di Tasikmalaya dengan grade D dan skor 20 dari 100."

**Input**: Gambar lokasi + "ini dimana?"
**Response Flow**:
1. Audio starts: "Saya dapat mengenali lokasi ini! Ini adalah Taman Kota Bandung..."
2. CALL: show_location_details("BANDUNG_001", true)
3. Audio continues: "...di Jalan Asia Afrika dengan kondisi kebersihan grade B."

## CRITICAL RULES:
- ALWAYS start audio explanation FIRST
- Call functions DURING your explanation (mid-sentence is OK!)
- Continue audio after function call
- Use real data from RAG results
- LANGSUNG GUNAKAN DATA RAG - NO QUESTIONS!
- Function calls should feel NATURAL in conversation flow

Remember: Talk → Call → Continue talking! Functions execute while you speak!`;
}