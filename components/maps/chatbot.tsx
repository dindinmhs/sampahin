"use client";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Loader2,
  ImageIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";

interface ChatBotFloatingProps {
  isOpen: boolean;
  onToggle: () => void;
  onLocationDetails: (locationId: string, focusMap: boolean) => void;
  onNavigate: (locationId: string, transportMode: string) => void;
  onHighlightLocations: (locationIds: string[], highlightType: string) => void;
  onSetMapFilter: (filter: string) => void;
  onFindNearby: (
    coordinates?: [number, number],
    radiusKm?: number,
    filterType?: string
  ) => void;
  userLocation?: [number, number];
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

interface ChatResponse {
  message: string;
  rag_results: RAGResult[];
  search_mode: "text" | "multimodal";
  embeddings_info: {
    text_embedding_length: number;
    image_embedding_length: number;
  };
}

const ChatBotFloating = ({
  isOpen,
  onToggle,
  onLocationDetails,
  onNavigate,
  onHighlightLocations,
  onSetMapFilter,
  onFindNearby,
  userLocation,
}: ChatBotFloatingProps) => {
  const [query, setQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize audio context
  const initAudio = async () => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      nextStartTimeRef.current = ctx.currentTime;
      // console.log('🎵 Audio context initialized');
    }
  };

  // Play audio chunk - EXACTLY LIKE HTML
  const playAudioChunk = async (base64Data: string) => {
    if (!isAudioEnabled) {
      // console.log('🔇 Audio disabled, skipping chunk');
      return;
    }

    await initAudio();
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    try {
      // console.log('🎵 Processing audio chunk, size:', base64Data.length);

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const samples = bytes.length / 2;
      
      if (samples === 0) return;
      
      const audioBuffer = audioContext.createBuffer(1, samples, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < samples; i++) {
        const byte1 = bytes[i * 2];
        const byte2 = bytes[i * 2 + 1];
        let sample = byte1 | (byte2 << 8);
        
        if (sample >= 32768) {
          sample -= 65536;
        }
        
        channelData[i] = sample / 32768.0;
      }

      audioQueueRef.current.push(audioBuffer);
      // console.log('🎵 Audio buffer added, queue length:', audioQueueRef.current.length);
      
      if (!isPlayingRef.current) {
        playNextChunk();
      }

    } catch (error) {
      console.error('❌ Error processing audio chunk:', error);
    }
  };

  // Play next chunk
  const playNextChunk = () => {
    if (audioQueueRef.current.length === 0) {
      // console.log('🎵 Audio queue empty, stopping playback');
      isPlayingRef.current = false;
      setIsPlayingAudio(false);
      return;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) {
      console.error('❌ No audio context available');
      isPlayingRef.current = false;
      setIsPlayingAudio(false);
      return;
    }

    // console.log('🎵 Playing next chunk, queue length:', audioQueueRef.current.length);
    isPlayingRef.current = true;
    setIsPlayingAudio(true);
    
    const audioBuffer = audioQueueRef.current.shift()!;
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    
    const duration = audioBuffer.duration * 1000;
    
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
    
    playbackTimeoutRef.current = setTimeout(() => {
      playNextChunk();
    }, duration + 10);
    
    source.onended = () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      setTimeout(() => playNextChunk(), 5);
    };
  };

  // Reset audio state
  const resetAudioState = () => {
    // console.log('🔄 Resetting audio state');
    
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlayingAudio(false);
    setIsProcessing(false)
    
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;
    }
  };

  // Handle form submission with streaming
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedImage) return;
    if (isProcessing) return;
    if (selectedImage && !query.trim()) {
      setError("Mohon berikan deskripsi atau pertanyaan untuk gambar yang diupload");
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    setError(null);
    setConnectionStatus("connecting");

    resetAudioState();

    try {
      // Step 1: Get RAG results
      const formData = new FormData();
      formData.append("query", query);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch("/api/chatbot-rag", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }

      const data: ChatResponse = await response.json();

      // Step 2: Prepare image base64 if needed
      let imageBase64: string | undefined;
      if (selectedImage) {
        const bytes = await selectedImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageBase64 = buffer.toString("base64");
      }

      // Step 3: Initialize AI session with POST
      const sessionId = Math.random().toString(36).substring(2);

      console.log('🚀 Step 1: Sending POST to create session...');
      const postResponse = await fetch(`/api/ai-agent-live?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          imageBase64,
          ragResults: data.rag_results,
          userLocation
        })
      });

      if (!postResponse.ok) {
        throw new Error('Failed to initialize AI session');
      }

      const { success } = await postResponse.json();
      if (!success) {
        throw new Error('Failed to queue request');
      }

      console.log('✅ Session created, opening SSE stream...');

      // Step 4: Open SSE stream with GET
      const eventSource = new EventSource(`/api/ai-agent-live?sessionId=${sessionId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 SSE connection opened');
      };

      eventSource.onmessage = async (event) => {
        try {
          const streamData = JSON.parse(event.data);
          console.log('📨 Received SSE message:', streamData.type);

          switch (streamData.type) {
            case 'connected':
              console.log('✅ AI Agent connected');
              setConnectionStatus("connected");
              break;

            case 'text':
              console.log('💬 Text received:', streamData.text);
              setAiResponse(prev => prev + streamData.text);
              setIsTextVisible(true);
              
              // Auto hide after 10 seconds
              setTimeout(() => {
                setIsTextVisible(false);
                setAiResponse("");
              }, 10000);
              break;

            case 'audioChunk':
              // ✅ FIX: Handle audio data properly
              if (streamData.data && streamData.data.length > 0) {
                // console.log('🎵 Audio chunk received, size:', streamData.data.length);
                await playAudioChunk(streamData.data);
              } else {
                console.log('⚠️ Empty audio chunk received');
              }
              break;

            case 'functionCalls':
              // ✅ FIX: Safely handle function calls
              console.log('🔧 Function calls received:', streamData.functionCalls);
              
              if (Array.isArray(streamData.functionCalls)) {
                streamData.functionCalls.forEach((call: any) => {
                  if (call && call.name) {
                    console.log(`🚀 Executing function: ${call.name}`, call.args);
                    executeFunctionCall(call.name, call.args || {});
                  } else {
                    console.warn('⚠️ Invalid function call format:', call);
                  }
                });
              } else {
                console.warn('⚠️ functionCalls is not an array:', streamData.functionCalls);
              }
              break;

            case 'complete':
              console.log('🏁 Stream complete');
              setIsProcessing(false);
              setIsLoading(false);
              eventSource.close();
              eventSourceRef.current = null;
              break;

            case 'error':
              console.error('❌ Stream error:', streamData.error);
              setError(streamData.error || 'Unknown error');
              setIsProcessing(false);
              setIsLoading(false);
              setConnectionStatus("disconnected");
              eventSource.close();
              eventSourceRef.current = null;
              break;

            default:
              console.warn('⚠️ Unknown message type:', streamData.type);
              break;
          }
        } catch (parseError) {
          console.error('❌ Error parsing SSE message:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ EventSource error:', error);
        setError("Connection error");
        setIsProcessing(false);
        setIsLoading(false);
        setConnectionStatus("disconnected");
        eventSource.close();
        eventSourceRef.current = null;
      };

      resetForm();

    } catch (error) {
      console.error("❌ Chatbot Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsProcessing(false);
      setIsLoading(false);
      setConnectionStatus("disconnected");
    }
  };

  // ✅ FIX: Add proper error handling and validation
  const executeFunctionCall = (functionName: string, args: any) => {
    console.log(`🚀 Executing function: ${functionName}`, args);
    
    try {
      switch (functionName) {
        case 'show_location_details':
          if (args?.location_id) {
            onLocationDetails(args.location_id, args?.focus_map !== false);
          } else {
            console.warn('⚠️ show_location_details missing location_id');
          }
          break;

        case 'navigate_to_location':
          if (args?.location_id) {
            onNavigate(args.location_id, args?.transport_mode || 'driving');
          } else {
            console.warn('⚠️ navigate_to_location missing location_id');
          }
          break;

        case 'highlight_locations':
          if (Array.isArray(args?.location_ids) && args.location_ids.length > 0) {
            onHighlightLocations(args.location_ids, args?.highlight_type || 'pulse');
          } else {
            console.warn('⚠️ highlight_locations missing or invalid location_ids');
          }
          break;

        case 'set_map_filter':
          if (args?.filter) {
            onSetMapFilter(args.filter);
          } else {
            console.warn('⚠️ set_map_filter missing filter');
          }
          break;

        case 'find_nearby_locations':
          onFindNearby(
            args?.coordinates, 
            args?.radius_km || 5, 
            args?.filter_type
          );
          break;

        default:
          console.warn(`⚠️ Unknown function: ${functionName}`);
          break;
      }
    } catch (error) {
      console.error(`❌ Error executing function ${functionName}:`, error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setQuery("");
    setSelectedImage(null);
    setImagePreview(null);
    setAiResponse("");
    setIsTextVisible(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (!isAudioEnabled) {
      resetAudioState();
    }
  };

  const stopCurrentAudio = () => {
    resetAudioState();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsProcessing(false);
      setIsLoading(false);
      setConnectionStatus("disconnected");
    }
  };

  // Initialize audio on user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      initAudio();
    };
    
    document.addEventListener('click', handleFirstClick, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleClickOutside = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[60]">
        <button
          onClick={onToggle}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-110 animate-pulse"
          title="Tanya AI Assistant"
        >
          <Sparkles size={24} className="text-white drop-shadow-sm" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-20 z-[60] w-80"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200">
        {isTextVisible && aiResponse && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium mb-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-blue-600" />
                  AI Response:
                </p>
                <p className="text-sm text-blue-700">{aiResponse}</p>
              </div>
              <button
                onClick={() => setIsTextVisible(false)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors ml-2"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Sparkles className="text-blue-600" size={20} />
            </div>
            <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Assistant Live
            </h4>
            
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
                title={`Status: ${connectionStatus}`}
              />

              {isPlayingAudio && (
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleAudio}
              className={`p-1 rounded transition-colors ${
                isAudioEnabled
                  ? "text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              title={isAudioEnabled ? "Matikan Audio" : "Nyalakan Audio"}
            >
              {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {isPlayingAudio && (
              <button
                onClick={stopCurrentAudio}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Stop Audio"
              >
                <X size={16} />
              </button>
            )}

            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {imagePreview && (
          <div className="p-3 border-b">
            <div className="relative inline-block">
              <Image
                width={200}
                height={200}
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                disabled={isLoading}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-3">
          <div className="mb-3">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tanya tentang kebersihan lokasi... (Live Streaming!)"
              className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                disabled={isLoading}
                title="Upload gambar"
              >
                <ImageIcon size={16} />
              </button>
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                isProcessing ||
                (selectedImage && !query.trim()) ||
                (!query.trim() && !selectedImage)
              }
              className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-1"
            >
              {isLoading || isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Streaming...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Live Chat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBotFloating;