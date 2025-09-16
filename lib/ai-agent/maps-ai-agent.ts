import { functionDefinitions } from '@/lib/ai-agent/definitions';
import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from '@google/genai';
import { AudioProcessor } from './audio-utils';

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

interface AIAgentConfig {
  onLocationDetails: (locationId: string, focusMap: boolean) => void;
  onNavigate: (locationId: string, transportMode: string) => void;
  onHighlightLocations: (locationIds: string[], highlightType: string) => void;
  onSetMapFilter: (filter: string) => void;
  onFindNearby: (coordinates?: [number, number], radiusKm?: number, filterType?: string) => void;
  onAudioGenerated: (audioData: string) => void;
  userLocation?: [number, number];
}

export class AIAgentService {
  private session: Session | undefined;
  private responseQueue: LiveServerMessage[] = [];
  private config: AIAgentConfig;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private isProcessing: boolean = false;
  private audioChunks: string[] = [];
  private isPlayingAudio: boolean = false;

  constructor(config: AIAgentConfig) {
    this.config = config;
  }

  async initialize() {
    if (this.isConnecting || this.isConnected) {
      console.log('AI Agent already connecting or connected');
      return;
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      });

      const model = 'models/gemini-2.5-flash-preview-native-audio-dialog';
      const tools = [{ functionDeclarations: functionDefinitions }];

      const sessionConfig = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
        },
        tools,
        systemInstruction: "You are a voice assistant. Always respond with audio. Provide helpful, detailed information in Indonesian based on the RAG data provided. Your audio response should be at least 3-5 seconds long."
      };

      console.log('🔧 Initializing AI Agent with config:', sessionConfig);

      this.session = await ai.live.connect({
        model,
        callbacks: {
          onopen: () => {
            console.debug('✅ AI Agent session opened');
            this.isConnected = true;
            this.isConnecting = false;
            this.connectionAttempts = 0;
            this.responseQueue = [];
          },
          onmessage: (message: LiveServerMessage) => {
            this.responseQueue.push(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error('❌ AI Agent error:', e.message);
            this.isConnected = false;
            this.isConnecting = false;
            this.isProcessing = false;
          },
          onclose: (e: CloseEvent) => {
            console.debug('🔒 AI Agent session closed:', e.reason);
            this.isConnected = false;
            this.isConnecting = false;
            this.isProcessing = false;
            this.session = undefined;
          },
        },
        config: sessionConfig
      });

      await this.waitForConnection();
    } catch (error) {
      console.error('❌ Failed to initialize AI Agent:', error);
      this.isConnecting = false;
      this.isProcessing = false;
      throw error;
    }
  }

  private async waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkConnection = () => {
        if (this.isConnected) resolve();
        else if (Date.now() - startTime > timeout) reject(new Error('Connection timeout'));
        else setTimeout(checkConnection, 100);
      };
      checkConnection();
    });
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected && this.session) return true;
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error('Max connection attempts reached');
      return false;
    }
    try {
      await this.initialize();
      return this.isConnected;
    } catch (error) {
      console.error('Failed to reconnect:', error);
      return false;
    }
  }

  async sendMessage(text: string, imageBase64?: string, ragResults?: RAGResult[]) {
    if (this.isProcessing) {
      console.log('Already processing a message, skipping...');
      return;
    }

    const connectionReady = await this.ensureConnection();
    if (!connectionReady || !this.session) {
      throw new Error('AI Agent session not available');
    }

    this.isProcessing = true;
    this.responseQueue = [];
    this.audioChunks = []; // Reset chunks for new message

    try {
      const ragContext = this.buildRAGContext(ragResults);
      const systemPrompt = this.buildSystemPrompt(ragContext);
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${text}`;

      console.log('📤 Sending to AI Agent:', { text, hasImage: !!imageBase64, ragResultsCount: ragResults?.length || 0 });

      this.session.sendClientContent({ turns: [fullPrompt] });

      await Promise.race([
        this.handleTurn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Response timeout')), 30000))
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      this.isConnected = false;
      this.session = undefined;
    } finally {
      this.isProcessing = false;
    }
  }

  private buildRAGContext(ragResults?: RAGResult[]): string {
    if (!ragResults || ragResults.length === 0) return "Tidak ada data lokasi yang relevan ditemukan.";
    let context = `Data lokasi yang relevan berdasarkan pencarian:\n\n`;
    ragResults.forEach((result, index) => {
      context += `${index + 1}. **${result.location_name}**\n   - ID: ${result.location_id}\n   - Alamat: ${result.address}, ${result.city}\n   - Grade: ${result.grade} (Skor: ${result.score}/100)\n\n`;
    });
    return context;
  }

  private buildSystemPrompt(ragContext: string): string {
  const userLocationInfo = this.config.userLocation 
    ? `Lokasi user saat ini: [${this.config.userLocation[0]}, ${this.config.userLocation[1]}]` 
    : "Lokasi user tidak diketahui";

  return `# Sampahin AI Assistant - Voice & Function Interface

CRITICAL RULES:
1. ALWAYS respond with AUDIO (minimum 3-5 seconds in Indonesian)
2. ALWAYS call appropriate functions based on user requests
3. NEVER just give audio without function calls

## Your Identity:
Voice assistant untuk aplikasi Sampahin - monitoring kebersihan lingkungan.

## Context:
${userLocationInfo}

## Available Data:
${ragContext}

## FUNCTION CALL MAPPING - MANDATORY:

### User wants location details:
- Keywords: "detail", "info", "tampilkan", "lihat", "buka", "informasi"
- MUST CALL: show_location_details(location_id_from_RAG, focus_map: true)

### User wants navigation:
- Keywords: "rute", "arah", "navigasi", "jalan", "pergi ke", "carikan jalan"
- MUST CALL: navigate_to_location(location_id_from_RAG, transport_mode: "driving")

### User wants to see/highlight locations:
- Keywords: "tunjukkan", "sorot", "highlight", "tampilkan di peta"
- MUST CALL: highlight_locations([location_ids_from_RAG], highlight_type: "pulse")

### User wants to filter:
- Keywords: "filter", "tampilkan hanya", "sembunyikan", "kategori"
- MUST CALL: set_map_filter(filter_type)

### User wants nearby search:
- Keywords: "terdekat", "sekitar", "dekat", "radius", "cari"
- MUST CALL: find_nearby_locations(coordinates, radius_km: 5, filter_type)

## RESPONSE PROTOCOL:

1. **Analyze** user intent and identify which function to call
2. **Extract** parameters from RAG data (use exact location_id values)
3. **Call** the appropriate function immediately
4. **Speak** your response explaining what you're doing

## EXAMPLES:

**Input**: "Tampilkan detail mall itu"
**Actions**:
- Audio: "Halo! Saya akan menampilkan detail mall untuk Anda. Mari saya buka informasinya."
- Function: show_location_details("mall_location_id_from_RAG", true)

**Input**: "Carikan jalan ke tempat kotor terdekat"
**Actions**:
- Audio: "Baik, saya akan mencarikan rute ke lokasi kotor terdekat. Mari saya buka navigasinya."
- Function: navigate_to_location("dirty_location_id_from_RAG", "driving")

## DATA EXTRACTION:
From RAG results, extract:
- location_id: result.location_id (EXACT VALUE)
- coordinates: [result.lat, result.lan] 
- grade/type: result.grade, result.type

## CRITICAL:
- ALWAYS call functions with EXACT location_id from RAG data
- NEVER make up location IDs
- ALWAYS provide audio explanation
- Use natural Indonesian speech

Remember: You are BOTH voice assistant AND function executor!`;
}

  private async handleTurn(): Promise<void> {
  let done = false;
  let messageCount = 0;
  const maxMessages = 1000000;
  let lastAudioChunkTime = Date.now();
  
  while (!done && messageCount < maxMessages) {
    try {
      const message = await this.waitMessage(120000);
      messageCount++;
      
      // Track when we last received audio
      if (message.serverContent?.modelTurn?.parts?.some(part => 
        part?.inlineData?.mimeType?.includes('audio'))) {
        lastAudioChunkTime = Date.now();
      }
      
      if (message.serverContent?.turnComplete) {
        console.log('🏁 Turn completed flag received.');
        done = true;
      }
      
      // Safety: if no audio chunks for 2 seconds and we have some audio, process it
      if (this.audioChunks.length > 0 && 
          Date.now() - lastAudioChunkTime > 60000) {
        console.log('⏰ No new audio chunks for 2 seconds, processing existing audio');
        this.processCompleteAudio();
        done = true;
      }
      
    } catch (error) {
      console.error('Error in handleTurn:', error);
      done = true;
    }
  }
  
  if (messageCount >= maxMessages) {
    console.warn('⚠️ Max messages reached, ending turn');
    // Process any remaining audio
    if (this.audioChunks.length > 0) {
      this.processCompleteAudio();
    }
  }
}

  private async waitMessage(timeout: number = 5000): Promise<LiveServerMessage> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkMessage = () => {
        const message = this.responseQueue.shift();
        if (message) {
          this.handleModelTurn(message);
          resolve(message);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Message timeout in waitMessage'));
        } else {
          setTimeout(checkMessage, 50);
        }
      };
      checkMessage();
    });
  }

  private handleModelTurn(message: LiveServerMessage) {
  console.log('📨 Complete message structure:', JSON.stringify(message, null, 2));

  // Debug toolCall specifically
  console.log('🔍 Checking for toolCall:', {
    hasToolCall: !!message.toolCall,
    toolCallKeys: message.toolCall ? Object.keys(message.toolCall) : [],
    toolCallContent: message.toolCall
  });

  // Handle function calls first with enhanced debugging
  if (message.toolCall?.functionCalls) {
    console.log('🔧 Function calls found:', {
      count: message.toolCall.functionCalls.length,
      calls: message.toolCall.functionCalls
    });
    
    message.toolCall.functionCalls.forEach((call, index) => {
      console.log(`🎯 Executing function ${index}:`, {
        name: call.name,
        args: call.args,
        id: call.id
      });
      if (call.name) {
        this.executeFunctionCall(call.name, call.args);
      }
    });

    if (this.session) {
      const functionResponses = message.toolCall.functionCalls.map(call => ({
        id: call.id,
        name: call.name,
        response: { response: 'Function executed successfully' }
      }));
      
      console.log('📤 Sending tool responses:', functionResponses);
      
      this.session.sendToolResponse({
        functionResponses
      });
    }
  } else {
    console.log('⚠️ No function calls found in message');
    
    // Additional debugging for missed function calls
    if (message.serverContent?.modelTurn?.parts) {
      message.serverContent.modelTurn.parts.forEach((part, index) => {
        console.log(`Part ${index} analysis:`, {
          hasText: !!part.text,
          textContent: part.text?.substring(0, 200),
          hasInlineData: !!part.inlineData,
          hasFunctionCall: !!part.functionCall,
          allKeys: Object.keys(part)
        });
      });
    }
  }

  // Handle audio collection
  if (message.serverContent?.modelTurn?.parts) {
    message.serverContent.modelTurn.parts.forEach((part, index) => {
      if (part?.inlineData && part.inlineData.mimeType?.includes('audio')) {
        console.log('🎵 Audio chunk received:', {
          mimeType: part.inlineData.mimeType,
          dataSize: part.inlineData.data?.length,
          chunkIndex: this.audioChunks.length
        });
        this.audioChunks.push(part.inlineData.data ?? '');
        console.log(`Total audio chunks collected: ${this.audioChunks.length}`);
      }

      if (part?.text) {
        console.log('💬 AI Agent text response:', part.text);
      }
    });
  }

  // Process audio when turn is complete
  if (message.serverContent?.turnComplete) {
    console.log('🏁 Turn complete, processing collected audio...');
    this.processCompleteAudio();
  }
}

  private processCompleteAudio() {
  console.log(`🎵 Processing complete audio. Chunks: ${this.audioChunks.length}, isPlayingAudio: ${this.isPlayingAudio}`);
  
  if (this.audioChunks.length === 0) {
    console.log('⚠️ No audio chunks to process');
    return;
  }
  
  if (this.isPlayingAudio) {
    console.log('⚠️ Already playing audio, skipping processing');
    return;
  }

  try {
    // Log each chunk size for debugging
    this.audioChunks.forEach((chunk, index) => {
      console.log(`Chunk ${index}: ${chunk.length} characters`);
    });
    
    // Combine all audio chunks
    const combinedAudioData = this.audioChunks.join('');
    console.log('🔗 Combined audio data size:', combinedAudioData.length);
    
    if (combinedAudioData.length === 0) {
      console.warn('❌ Combined audio data is empty');
      this.audioChunks = [];
      return;
    }

    // Validate minimum audio size (rough estimation for meaningful audio)
    if (combinedAudioData.length < 1000) { // Adjust this threshold as needed
      console.warn(`⚠️ Audio data too small (${combinedAudioData.length} chars), might be incomplete`);
      // You can choose to still process it or wait for more data
      // For now, let's process it anyway but with a warning
    }

    // Convert to proper audio format
    const audioBuffer = this.convertToCleanWav(combinedAudioData);
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log(`🔊 Sending complete audio to UI:`, {
      chunks: this.audioChunks.length,
      combinedSize: combinedAudioData.length,
      finalSize: audioBase64.length
    });
    
    // Send to UI for playback
    this.config.onAudioGenerated(audioBase64);
    
  } catch (error) {
    console.error('❌ Error processing complete audio:', error);
  } finally {
    // Clear processed chunks
    this.audioChunks = [];
  }
}

  private executeFunctionCall(functionName: string, args: any) {
  console.log(`🚀 Executing function: ${functionName}`, {
    functionName,
    args,
    argsType: typeof args,
    argsKeys: args ? Object.keys(args) : []
  });
  
  try {
    switch (functionName) {
      case 'show_location_details':
        console.log('📍 Calling onLocationDetails with:', args.location_id, args.focus_map);
        this.config.onLocationDetails(args.location_id, args.focus_map || true);
        break;
        
      case 'navigate_to_location':
        console.log('🧭 Calling onNavigate with:', args.location_id, args.transport_mode);
        this.config.onNavigate(args.location_id, args.transport_mode || 'driving');
        break;
        
      case 'highlight_locations':
        console.log('🔦 Calling onHighlightLocations with:', args.location_ids, args.highlight_type);
        this.config.onHighlightLocations(args.location_ids, args.highlight_type || 'pulse');
        break;
        
      case 'set_map_filter':
        console.log('🔧 Calling onSetMapFilter with:', args.filter);
        this.config.onSetMapFilter(args.filter);
        break;
        
      case 'find_nearby_locations':
        console.log('📍 Calling onFindNearby with:', args.coordinates, args.radius_km, args.filter_type);
        this.config.onFindNearby(args.coordinates, args.radius_km || 5, args.filter_type);
        break;
        
      default:
        console.warn('❌ Unknown function call:', functionName);
    }
    
    console.log(`✅ Function ${functionName} executed successfully`);
    
  } catch (error) {
    console.error(`❌ Error executing function ${functionName}:`, error);
  }
}

  private convertToCleanWav(base64Data: string): Buffer {
    try {
      const rawAudioData = Buffer.from(base64Data, 'base64');
      const sampleRate = 24000, numChannels = 1, bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const header = Buffer.alloc(44);

      header.write('RIFF', 0);
      header.writeUInt32LE(36 + rawAudioData.length, 4);
      header.write('WAVE', 8);
      header.write('fmt ', 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(numChannels, 22);
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(byteRate, 28);
      header.writeUInt16LE(blockAlign, 32);
      header.writeUInt16LE(bitsPerSample, 34);
      header.write('data', 36);
      header.writeUInt32LE(rawAudioData.length, 40);

      let audioBuffer = Buffer.concat([header, rawAudioData]);
      
      if (AudioProcessor?.normalizeAudioVolume) audioBuffer = AudioProcessor.normalizeAudioVolume(audioBuffer);
      if (AudioProcessor?.removeClicks) audioBuffer = AudioProcessor.removeClicks(audioBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error('Error converting audio:', error);
      throw error;
    }
  }

  get connected(): boolean { return this.isConnected; }
  get connecting(): boolean { return this.isConnecting; }
  get processing(): boolean { return this.isProcessing; }

  async reconnect(): Promise<void> {
    this.disconnect();
    await this.initialize();
  }

  disconnect() {
    this.isProcessing = false;
    this.isPlayingAudio = false;
    if (this.session) {
      try { this.session.close(); } catch (error) { console.warn('Error closing session:', error); }
      this.session = undefined;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.responseQueue = [];
    this.audioChunks = [];
  }
}