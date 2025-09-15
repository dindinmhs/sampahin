import { mapsFunctionDefinitions } from '@/definitions';
import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
  Type,
} from '@google/genai';

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

interface AIAgentCallbacks {
  onShowLocationDetails: (locationId: string, focusMap: boolean) => void;
  onShowNavigation: (locationId: string, openGoogleMaps: boolean) => void;
  onHighlightLocations: (locationIds: string[], zoomToFit: boolean, color: string) => void;
  onFilterCategory: (category: 'all' | 'clean' | 'dirty' | 'cleaning') => void;
  onSearchLocations: (query: string, filters?: any) => Promise<RAGResult[]>;
  onGetNearbyFacilities: (locationId: string, facilityTypes: string[], radiusKm: number) => Promise<any[]>;
}

export class MapsAIAgent {
  private session: Session | undefined;
  private responseQueue: LiveServerMessage[] = [];
  private audioParts: string[] = [];
  private callbacks: AIAgentCallbacks;
  private ragResults: RAGResult[] = [];

  constructor(callbacks: AIAgentCallbacks) {
    this.callbacks = callbacks;
  }

  async initialize() {
    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    });

    const model = 'models/gemini-2.5-flash-preview-native-audio-dialog';

    const tools = [
      {
        functionDeclarations: mapsFunctionDefinitions,
      }
    ];

    const config = {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Puck',
          }
        }
      },
      contextWindowCompression: {
        triggerTokens: '25600',
        slidingWindow: { targetTokens: '12800' },
      },
      tools,
    };

    this.session = await ai.live.connect({
      model,
      callbacks: {
        onopen: () => {
          console.log('🤖 AI Agent connected');
        },
        onmessage: (message: LiveServerMessage) => {
          this.responseQueue.push(message);
        },
        onerror: (e: ErrorEvent) => {
          console.error('❌ AI Agent error:', e.message);
        },
        onclose: (e: CloseEvent) => {
          console.log('🔌 AI Agent disconnected:', e.reason);
        },
      },
      config
    });

    // Send initial context with system prompt
    await this.sendSystemPrompt();
  }

  private async sendSystemPrompt() {
    const systemPrompt = `# Sampahin Maps AI Assistant

Anda adalah AI assistant untuk aplikasi Sampahin Maps yang membantu pengguna menjelajahi dan mencari informasi tentang kebersihan lingkungan di Indonesia.

## Kemampuan Anda:
1. **Mencari Lokasi** - Cari tempat berdasarkan nama, alamat, atau kondisi kebersihan
2. **Menampilkan Detail** - Buka sidebar dengan informasi lengkap lokasi
3. **Navigasi** - Berikan rute ke lokasi tujuan
4. **Highlight Marker** - Tandai lokasi tertentu di peta
5. **Filter Kategori** - Ubah tampilan peta berdasarkan jenis lokasi
6. **Fasilitas Terdekat** - Cari toilet, tempat sampah, dll di sekitar lokasi

## Data RAG Context:
${this.formatRAGContext()}

## Instruksi:
- Gunakan function calls untuk setiap permintaan user
- Berikan informasi berdasarkan data RAG yang tersedia
- Jawab dalam bahasa Indonesia yang ramah dan informatif
- Jelaskan grade kebersihan: A=Sangat Bersih, B=Bersih, C=Cukup, D=Kotor, E=Sangat Kotor
- Sebutkan skor kebersihan dan kondisi terbaru
- Berikan rekomendasi yang actionable`;

    this.session?.sendClientContent({
      turns: [systemPrompt]
    });
  }

  private formatRAGContext(): string {
    if (this.ragResults.length === 0) {
      return "Belum ada data lokasi yang dimuat.";
    }

    return this.ragResults.map((result, index) => 
      `Lokasi ${index + 1}: ${result.location_name}
- ID: ${result.location_id}
- Alamat: ${result.address}, ${result.city}, ${result.province}
- Grade: ${result.grade} (Skor: ${result.score}/100)
- Tipe: ${result.type === 'clean' ? 'Bersih' : result.type === 'dirty' ? 'Kotor' : 'Sedang Dibersihkan'}
- Kondisi: ${result.ai_description}
- Koordinat: [${result.lan}, ${result.lat}]
- Similarity: ${(result.similarity_score * 100).toFixed(1)}%`
    ).join('\n\n');
  }

  async sendQuery(query: string, ragResults?: RAGResult[]) {
    if (ragResults) {
      this.ragResults = ragResults;
      await this.sendSystemPrompt(); // Update context with new RAG data
    }

    this.session?.sendClientContent({
      turns: [query]
    });

    await this.handleTurn();
  }

  private async handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;
    while (!done) {
      const message = await this.waitMessage();
      turn.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turn;
  }

  private async waitMessage(): Promise<LiveServerMessage> {
    let done = false;
    let message: LiveServerMessage | undefined = undefined;
    while (!done) {
      message = this.responseQueue.shift();
      if (message) {
        await this.handleModelTurn(message);
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message!;
  }

  private async handleModelTurn(message: LiveServerMessage) {
    // Handle function calls
    if (message.toolCall) {
      console.log('🔧 Function calls:', message.toolCall.functionCalls);
      
      const functionResponses = await Promise.all(
        message.toolCall.functionCalls?.map(async (functionCall) => {
          const response = await this.executeFunctionCall(functionCall);
          return {
            id: functionCall.id,
            name: functionCall.name,
            response: { response }
          };
        }) ?? []
      );

      this.session?.sendToolResponse({
        functionResponses
      });
    }

    // Handle audio response
    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent?.modelTurn?.parts?.[0];

      if (part?.inlineData) {
        this.audioParts.push(part.inlineData.data ?? '');
        const audioBuffer = this.convertToWav(this.audioParts, part.inlineData.mimeType ?? '');
        this.playAudio(audioBuffer);
      }

      if (part?.text) {
        console.log('🤖 AI Response:', part.text);
      }
    }
  }

  private async executeFunctionCall(functionCall: any): Promise<string> {
    const { name, args } = functionCall;
    
    console.log(`🎯 Executing function: ${name}`, args);

    try {
      switch (name) {
        case 'search_locations':
          const searchResults = await this.callbacks.onSearchLocations(args.query, args.filters);
          return `Ditemukan ${searchResults.length} lokasi: ${searchResults.map(r => r.location_name).join(', ')}`;

        case 'show_location_details':
          this.callbacks.onShowLocationDetails(args.location_id, args.focus_map ?? true);
          const location = this.ragResults.find(r => r.location_id === args.location_id);
          return `Menampilkan detail ${location?.location_name || 'lokasi'} di sidebar`;

        case 'show_navigation_route':
          this.callbacks.onShowNavigation(args.destination_location_id, args.open_google_maps ?? false);
          const destination = this.ragResults.find(r => r.location_id === args.destination_location_id);
          return `Menampilkan rute navigasi ke ${destination?.location_name || 'lokasi tujuan'}`;

        case 'highlight_locations_on_map':
          this.callbacks.onHighlightLocations(args.location_ids, args.zoom_to_fit ?? true, args.highlight_color ?? 'blue');
          return `Menyoroti ${args.location_ids.length} lokasi di peta`;

        case 'filter_map_category':
          this.callbacks.onFilterCategory(args.category);
          return `Filter peta diubah ke kategori: ${args.category}`;

        case 'get_nearby_facilities':
          const facilities = await this.callbacks.onGetNearbyFacilities(args.location_id, args.facility_types, args.radius_km ?? 1);
          return `Ditemukan ${facilities.length} fasilitas terdekat`;

        default:
          return `Function ${name} tidak dikenali`;
      }
    } catch (error) {
      console.error(`❌ Error executing ${name}:`, error);
      return `Gagal menjalankan fungsi ${name}`;
    }
  }

  private convertToWav(rawData: string[], mimeType: string): ArrayBuffer {
    // Implementation sama seperti di contoh code
    const options = this.parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = this.createWavHeader(dataLength, options);
    const buffer = Buffer.concat(rawData.map(data => Buffer.from(data, 'base64')));
    return Buffer.concat([wavHeader, buffer]);
  }

  private parseMimeType(mimeType: string) {
    // Implementation parsing mime type untuk audio
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    return {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
    };
  }

  private createWavHeader(dataLength: number, options: any): Buffer {
    // Implementation WAV header creation
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
  }

  private playAudio(audioBuffer: ArrayBuffer) {
    // Play audio using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContext.decodeAudioData(audioBuffer)
      .then((decodedData) => {
        const source = audioContext.createBufferSource();
        source.buffer = decodedData;
        source.connect(audioContext.destination);
        source.start(0);
      })
      .catch((error) => {
        console.error('❌ Error playing audio:', error);
      });
  }

  disconnect() {
    this.session?.close();
  }
}