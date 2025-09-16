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
  onTextGenerated?: (text: string) => void; // Add text callback
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

      // FIXED: Use the exact model from documentation
      const model = 'models/gemini-2.5-flash-live-preview';
      const tools = [{ functionDeclarations: functionDefinitions }];

      // FIXED: Follow documentation pattern - only AUDIO modality for function calls
      const sessionConfig = {
        responseModalities: [Modality.AUDIO], // Back to AUDIO only like documentation
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          languageCode: 'id-ID',
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
        },
        tools,
        systemInstruction: `You are a voice assistant for Sampahin app. 

CRITICAL INSTRUCTIONS:
1. ALWAYS call appropriate functions based on user requests
2. ALWAYS provide audio response in Indonesian (3-5 seconds)
3. Function calls are MANDATORY - never skip them
4. When user asks for location details, navigation, filtering, etc., you MUST call the corresponding functions.

Use the exact location_id values from the provided RAG data when calling functions.`
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
    this.audioChunks = [];

    try {
      const ragContext = this.buildRAGContext(ragResults);
      const systemPrompt = this.buildSystemPrompt(ragContext);
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${text}`;

      console.log('📤 Sending to AI Agent:', { 
        text, 
        hasImage: !!imageBase64, 
        ragResultsCount: ragResults?.length || 0,
        promptLength: fullPrompt.length
      });

      this.session.sendClientContent({ turns: [fullPrompt] });

      // FIXED: Use documentation pattern
      await this.handleTurn();

    } catch (error) {
      console.error('Error sending message:', error);
      this.isConnected = false;
      this.session = undefined;
      throw error;
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

## CRITICAL INSTRUCTIONS:
1. ALWAYS provide conversational audio response in Indonesian first
2. Call appropriate functions DURING or AFTER your explanation
3. Function calls can happen at any time during conversation, not just at the start
4. Explain what you're showing while calling the functions

## Your Identity:
Voice assistant untuk aplikasi Sampahin - monitoring kebersihan lingkungan Indonesia.

## Context:
${userLocationInfo}

## Available Data:
${ragContext}

## RESPONSE STRATEGY - NATURAL CONVERSATION:
1. **Start with conversational audio explanation**
2. **Call functions while or after explaining** 
3. **Continue explaining what the user will see**

## FUNCTION CALL MAPPING:

### User wants location details:
- Keywords: "detail", "info", "tampilkan", "lihat", "buka", "informasi", "tunjukkan"
- Audio Response: "Baik, saya akan menampilkan detail lokasi [nama] untuk Anda. Lokasi ini berada di [alamat] dengan grade kebersihan [grade] dan skor [score] dari 100. [Penjelasan kondisi]"
- THEN CALL: show_location_details(location_id_from_RAG, focus_map: true)
- Continue: "Sekarang Anda bisa melihat detail lengkapnya di sidebar."

### User wants navigation:
- Keywords: "rute", "arah", "navigasi", "jalan", "pergi ke", "carikan jalan"
- Audio Response: "Saya akan membantu mencarikan rute ke [nama lokasi] di [alamat]. Lokasi ini memiliki kondisi kebersihan grade [grade]."
- THEN CALL: navigate_to_location(location_id_from_RAG, transport_mode: "driving")
- Continue: "Navigasi telah dimulai. Ikuti petunjuk di peta untuk sampai ke tujuan."

### User wants to see/highlight locations:
- Keywords: "tunjukkan", "sorot", "highlight", "tampilkan di peta", "yang ada di", "apa saja"
- Audio Response: "Saya akan menampilkan [jumlah] lokasi yang sesuai dengan pencarian Anda. Mari saya sorot lokasinya di peta."
- THEN CALL: highlight_locations([location_ids_from_RAG], highlight_type: "pulse")
- Continue: "Sekarang Anda bisa melihat lokasi-lokasi tersebut tersorot di peta dengan warna yang berbeda."

## ENHANCED EXAMPLES WITH NATURAL FLOW:

**Input**: "Tampilkan detail lokasi Tasik"
**Response**:
Audio: "Baik, saya akan menampilkan detail Tasik untuk Anda. Lokasi ini berada di Tasikmalaya, Jawa Barat dengan grade kebersihan D dan skor 20 dari 100. Kondisi cukup kotor dan memerlukan pembersihan."
Function: show_location_details("TASIK_001", true) // Called during explanation
Audio continues: "Sekarang sidebar detail telah terbuka dan Anda bisa melihat informasi lengkapnya."

**Input**: "Lokasi kotor yang ada di Tasik ada apa saja?"
**Response**:
Audio: "Mari saya cari lokasi kotor di area Tasikmalaya. Dari data yang tersedia, ada beberapa lokasi dengan kondisi kurang baik di area tersebut."
Function: highlight_locations(["TASIK_001", "TASIK_002"], "pulse") // Called while explaining
Audio continues: "Saya telah menyorot 2 lokasi kotor di Tasik. Yang terkotor adalah [nama] dengan grade D. Lokasi-lokasi ini terlihat berkedip di peta."

## CRITICAL RULES:
- ALWAYS start with natural conversational explanation
- Call functions DURING your explanation, not before
- Continue explaining what the user will see after function call
- Use real data from RAG results in your audio response
- Be conversational and helpful, not robotic

Remember: Talk first, act during talking, explain what happened!`;
}

  private async handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;
    
    console.log("⏳ Starting to handle turn, waiting for messages...");
    
    while (!done) {
      const message = await this.waitMessage();
      turn.push(message);
      
      if (message.serverContent && message.serverContent.turnComplete) {
        console.log('🏁 Turn complete flag received.');
        done = true;
      }
    }
    
    console.log('✅ Turn handling finished.', {
      messagesProcessed: turn.length,
      audioChunks: this.audioChunks.length
    });

    // Process audio after turn is complete
    if (this.audioChunks.length > 0) {
      this.processCompleteAudio();
    }
    
    return turn;
  }

    private async waitMessage(): Promise<LiveServerMessage> {
    let done = false;
    let message: LiveServerMessage | undefined = undefined;
    
    while (!done) {
      message = this.responseQueue.shift();
      if (message) {
        // CRITICAL: Process message here like documentation
        this.handleModelTurn(message);
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message!;
  }

  private processMessage(message: LiveServerMessage): { hasAudio: boolean; hasFunctionCalls: boolean; hasText: boolean } {
  let hasAudio = false;
  let hasFunctionCalls = false;
  let hasText = false;

  console.log('📨 Processing message:', {
    hasToolCall: !!message.toolCall,
    hasServerContent: !!message.serverContent,
    turnComplete: message.serverContent?.turnComplete
  });

  // 1. Handle function calls FIRST
  if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
    console.log('🔧 Function calls found:', message.toolCall.functionCalls.length);
    hasFunctionCalls = true;
    
    message.toolCall.functionCalls.forEach((call, index) => {
      console.log(`🎯 Executing function ${index + 1}:`, {
        name: call.name,
        args: call.args,
        id: call.id
      });
      
      if (call.name) {
        this.executeFunctionCall(call.name, call.args);
      }
    });

    // Send tool response immediately
    if (this.session) {
      const functionResponses = message.toolCall.functionCalls.map(call => ({
        id: call.id,
        name: call.name,
        response: { response: 'Function executed successfully' }
      }));
      
      console.log('📤 Sending tool responses:', functionResponses);
      this.session.sendToolResponse({ functionResponses });
    }
  }

  // 2. Handle content (text and audio)
  if (message.serverContent?.modelTurn?.parts) {
    message.serverContent.modelTurn.parts.forEach((part, index) => {
      // Handle text content
      if (part?.text) {
        console.log('💬 Text content received:', part.text.substring(0, 200) + '...');
        hasText = true;
        
        // Send text to UI
        this.config.onTextGenerated?.(part.text);
      }

      // Handle audio content
      if (part?.inlineData?.mimeType?.includes('audio') && part.inlineData.data) {
        console.log(`🎵 Audio chunk ${index} received (${part.inlineData.data.length} chars)`);
        this.audioChunks.push(part.inlineData.data);
        hasAudio = true;
      }
    });
  }

  return { hasAudio, hasFunctionCalls, hasText };
}

  private handleModelTurn(message: LiveServerMessage) {
    console.log('📨 Processing message:', {
      hasToolCall: !!message.toolCall,
      hasServerContent: !!message.serverContent,
      turnComplete: message.serverContent?.turnComplete
    });

    // 1. Handle function calls first (from documentation)
    if (message.toolCall) {
      console.log('🔧 Function calls found:', message.toolCall.functionCalls?.length || 0);
      
      message.toolCall.functionCalls?.forEach(
        functionCall => {
          console.log(`🎯 Execute function ${functionCall.name} with arguments:`, JSON.stringify(functionCall.args));
          // Execute the function
          this.executeFunctionCall(functionCall.name, functionCall.args);
        }
      );

      // CRITICAL: Send tool response exactly like documentation
      this.session?.sendToolResponse({
        functionResponses:
          message.toolCall.functionCalls?.map(functionCall => ({
            id: functionCall.id,
            name: functionCall.name,
            response: { response: 'Function executed successfully' } // Simple response like docs
          })) ?? []
      });
    }

    // 2. Handle content (audio and text)
    if (message.serverContent?.modelTurn?.parts) {
      message.serverContent.modelTurn.parts.forEach((part, index) => {
        // Handle text content
        if (part?.text) {
          console.log('💬 Text content:', part.text.substring(0, 200) + '...');
          this.config.onTextGenerated?.(part.text);
        }

        // Handle audio content (from documentation pattern)
        if (part?.inlineData) {
          console.log(`🎵 Audio chunk ${index} received:`, {
            mimeType: part.inlineData.mimeType,
            dataSize: part.inlineData.data?.length
          });
          
          // Collect audio parts like documentation
          this.audioChunks.push(part.inlineData.data ?? '');
        }
      });
    }
  }

  private createWavHeader(dataLength: number, options: any): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

    return buffer;
  }

  private convertToWav(rawData: string[], mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = this.createWavHeader(dataLength, options);
    const buffer = Buffer.concat(rawData.map(data => Buffer.from(data, 'base64')));

    return Buffer.concat([wavHeader, buffer]);
  }

  private parseMimeType(mimeType: string) {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options = {
      numChannels: 1,
      bitsPerSample: 16,
      sampleRate: 24000,
    };

    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options;
  }

  private processCompleteAudio() {
    console.log(`🎵 Processing ${this.audioChunks.length} audio chunks...`);
    
    if (this.audioChunks.length === 0) {
      console.log('⚠️ No audio chunks to process');
      return;
    }
    
    if (this.isPlayingAudio) {
      console.log('⚠️ Already playing audio, skipping processing');
      return;
    }

    try {
      // Combine audio chunks like documentation
      const combinedAudioData = this.audioChunks.join('');
      console.log('🔗 Combined audio data size:', combinedAudioData.length);
      
      if (combinedAudioData.length === 0) {
        console.warn('❌ Combined audio data is empty');
        this.audioChunks = [];
        return;
      }

      // Convert to WAV using documentation method
      const audioBuffer = this.convertToWav(this.audioChunks, 'audio/pcm;rate=24000');
      const audioBase64 = audioBuffer.toString('base64');
      
      console.log(`🔊 Sending complete audio to UI (${audioBase64.length} chars)`);
      this.config.onAudioGenerated(audioBase64);
      
    } catch (error) {
      console.error('❌ Error processing complete audio:', error);
    } finally {
      this.audioChunks = [];
    }
  }

  private executeFunctionCall(functionName: string, args: any) {
    console.log(`🚀 EXECUTING FUNCTION: ${functionName}`, {
      functionName,
      args,
      hasArgs: !!args
    });
    
    try {
      switch (functionName) {
        case 'show_location_details':
          console.log('📍 Calling onLocationDetails:', {
            locationId: args?.location_id,
            focusMap: args?.focus_map !== false
          });
          this.config.onLocationDetails(args?.location_id, args?.focus_map !== false);
          break;
          
        case 'navigate_to_location':
          console.log('🧭 Calling onNavigate:', {
            locationId: args?.location_id,
            transportMode: args?.transport_mode || 'driving'
          });
          this.config.onNavigate(args?.location_id, args?.transport_mode || 'driving');
          break;
          
        case 'highlight_locations':
          console.log('🔦 Calling onHighlightLocations:', {
            locationIds: args?.location_ids,
            highlightType: args?.highlight_type || 'pulse'
          });
          this.config.onHighlightLocations(args?.location_ids || [], args?.highlight_type || 'pulse');
          break;
          
        case 'set_map_filter':
          console.log('🔧 Calling onSetMapFilter:', { filter: args?.filter });
          this.config.onSetMapFilter(args?.filter);
          break;
          
        case 'find_nearby_locations':
          console.log('📍 Calling onFindNearby:', {
            coordinates: args?.coordinates,
            radiusKm: args?.radius_km || 5,
            filterType: args?.filter_type
          });
          this.config.onFindNearby(args?.coordinates, args?.radius_km || 5, args?.filter_type);
          break;
          
        default:
          console.warn('❌ Unknown function:', functionName);
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