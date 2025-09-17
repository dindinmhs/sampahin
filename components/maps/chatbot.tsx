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
  RefreshCw,
} from "lucide-react";
import { AIAgentService } from "@/lib/ai-agent/maps-ai-agent";
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
  search_mode: "text" | "image" | "multimodal";
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
  const [aiAgent, setAiAgent] = useState<AIAgentService | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize AI Agent
  useEffect(() => {
    if (isOpen && !aiAgent) {
      initializeAgent();
    }

    return () => {
      if (aiAgent && !isOpen) {
        aiAgent.disconnect();
        setAiAgent(null);
        setConnectionStatus("disconnected");
      }
    };
  }, [isOpen]);

  const initializeAgent = async () => {
    setConnectionStatus("connecting");
    setError(null);

    try {
      const agent = new AIAgentService({
        onLocationDetails,
        onNavigate,
        onHighlightLocations,
        onSetMapFilter,
        onFindNearby,
        onAudioGenerated: handleAudioGenerated,
        onTextGenerated: handleTextGenerated, // Add text handler
        userLocation,
      });

      await agent.initialize();
      setAiAgent(agent);
      setConnectionStatus("connected");
      console.log("AI Agent initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AI Agent:", error);
      setError("Failed to connect to AI Agent");
      setConnectionStatus("disconnected");
    }
  };
  const handleTextGenerated = (text: string) => {
    console.log("📝 Text response received:", text);
    setAiResponse(text);
    setIsTextVisible(true);

    // Auto-hide text after 10 seconds
    setTimeout(() => {
      setIsTextVisible(false);
    }, 10000);
  };
  const handleReconnect = async () => {
    if (aiAgent) {
      aiAgent.disconnect();
    }
    setAiAgent(null);
    await initializeAgent();
  };

  // Auto focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perbaiki method handleAudioGenerated
  const handleAudioGenerated = async (audioBase64: string) => {
    if (!isAudioEnabled) {
      console.log("🔇 Audio disabled, skipping playback");
      return;
    }

    console.log("🎵 Received complete audio for playback:", {
      size: audioBase64.length,
      timestamp: new Date().toISOString(),
    });

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        console.log("⏹️ Stopping current audio");
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.src = "";
        setCurrentAudio(null);
      }

      // Convert base64 to audio buffer with better error handling
      let binaryString: string;
      try {
        binaryString = atob(audioBase64);
      } catch (decodeError) {
        console.error("❌ Failed to decode base64 audio:", decodeError);
        return;
      }

      // Create typed array from binary string
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      // Create blob with proper MIME type
      const blob = new Blob([uint8Array], { type: "audio/wav" });

      // Validate blob size
      if (blob.size === 0) {
        console.error("❌ Generated audio blob is empty");
        return;
      }

      console.log("📊 Audio blob created:", {
        size: blob.size,
        type: blob.type,
      });

      const audioUrl = URL.createObjectURL(blob);

      // Create new audio element with enhanced configuration
      const audio = new Audio();

      // Set audio properties
      audio.preload = "auto"; // Changed from 'metadata' to 'auto'
      audio.volume = 0.8;
      audio.crossOrigin = "anonymous";

      // Set up promise-based loading
      const loadAudio = () => {
        return new Promise<void>((resolve, reject) => {
          const handleCanPlayThrough = () => {
            console.log("✅ Audio can play through completely:", {
              duration: audio.duration,
              readyState: audio.readyState,
            });
            cleanup();
            resolve();
          };

          const handleError = () => {
            console.error("❌ Audio loading error:", {
              error: audio.error,
              code: audio.error?.code,
              message: audio.error?.message,
            });
            cleanup();
            reject(new Error(`Audio loading failed: ${audio.error?.message}`));
          };

          const handleLoadStart = () => {
            console.log("📥 Audio loading started");
          };

          const handleProgress = () => {
            if (audio.buffered.length > 0) {
              const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
              const duration = audio.duration || 0;
              const percent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
              console.log(`📊 Audio buffering: ${percent.toFixed(1)}%`);
            }
          };

          const cleanup = () => {
            audio.removeEventListener("canplaythrough", handleCanPlayThrough);
            audio.removeEventListener("error", handleError);
            audio.removeEventListener("loadstart", handleLoadStart);
            audio.removeEventListener("progress", handleProgress);
          };

          // Add event listeners
          audio.addEventListener("canplaythrough", handleCanPlayThrough, {
            once: true,
          });
          audio.addEventListener("error", handleError, { once: true });
          audio.addEventListener("loadstart", handleLoadStart, { once: true });
          audio.addEventListener("progress", handleProgress);

          // Set source and start loading
          audio.src = audioUrl;
          audio.load();
        });
      };

      // Set up playback event handlers
      const setupPlaybackHandlers = () => {
        const handlePlay = () => {
          console.log("▶️ Audio playback started");
          setIsPlayingAudio(true);
        };

        const handlePause = () => {
          console.log("⏸️ Audio playback paused");
          setIsPlayingAudio(false);
        };

        const handleEnded = () => {
          console.log("🏁 Audio playback completed");
          cleanupAudio();
        };

        const handleError = () => {
          console.error("❌ Audio playback error:", {
            error: audio.error,
            code: audio.error?.code,
            message: audio.error?.message,
          });
          cleanupAudio();
        };

        const cleanupAudio = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          setIsPlayingAudio(false);
        };

        // Add playback event listeners
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        return cleanupAudio;
      };

      // Load audio first, then set up playback
      await loadAudio();

      const cleanupAudio = setupPlaybackHandlers();
      setCurrentAudio(audio);

      // Start playback
      try {
        await audio.play();
        console.log("🎵 Audio started playing successfully");
      } catch (playError) {
        console.error("❌ Failed to start audio playback:", playError);
        cleanupAudio();

        // Try to handle autoplay restrictions
        if (
          playError instanceof Error &&
          playError.name === "NotAllowedError"
        ) {
          console.log("ℹ️ Autoplay blocked - user interaction required");
          // You could show a UI notification here
        }
      }
    } catch (error) {
      console.error("❌ Error in handleAudioGenerated:", error);
      setIsPlayingAudio(false);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (currentAudio && isAudioEnabled) {
      currentAudio.pause();
      setIsPlayingAudio(false);
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlayingAudio(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedImage) return;
    if (isProcessing) return;
    if (selectedImage && !query.trim()) {
      console.log("❌ Image provided but no text query");
      setError(
        "Mohon berikan deskripsi atau pertanyaan untuk gambar yang diupload"
      );
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    setError(null);

    try {
      // First get RAG results
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

      // Enhanced console logging
      // console.log('=== SAMPAHIN AI CHATBOT RESULTS ===');
      // console.log('🔍 Query:', query);
      // console.log('🖼️ Has Image:', !!selectedImage);
      // console.log('🤖 Search Mode:', data.search_mode);
      // console.log('📊 Embeddings Info:');
      // console.log('   - Text Embedding:', data.embeddings_info.text_embedding_length, 'dimensions');
      // console.log('   - Image Embedding:', data.embeddings_info.image_embedding_length, 'dimensions');
      // console.log('📍 RAG Results Count:', data.rag_results.length);
      // console.log('');

      // if (data.rag_results.length > 0) {
      //   console.log('📋 Detailed Location Results:');
      //   data.rag_results.forEach((result, index) => {
      //     console.log(`${index + 1}. 📍 ${result.location_name}`);
      //     console.log(`   🏆 Grade: ${result.grade} | Score: ${result.score}/100`);
      //     console.log(`   🎯 Type: ${result.type === 'clean' ? '✅ Bersih' : '❌ Kotor'}`);
      //     console.log(`   📈 Overall Similarity: ${result.similarity_score}`)
      //     console.log(`   🌍 Location: ${result.city}, ${result.province}`);
      //     console.log(`   📌 Coordinates: [${result.lan.toFixed(4)}, ${result.lat.toFixed(4)}]`);
      //     console.log('   ────────────────────────────');
      //   });
      // }
      // console.log('===================================');

      // Send to AI Agent with RAG results
      if (aiAgent && connectionStatus === "connected" && !aiAgent.processing) {
        let imageBase64: string | undefined;
        if (selectedImage) {
          const bytes = await selectedImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          imageBase64 = buffer.toString("base64");
        }

        try {
          await aiAgent.sendMessage(query, imageBase64, data.rag_results);
          console.log("✅ Message sent to AI Agent with RAG context");
        } catch (agentError) {
          console.error("❌ AI Agent error:", agentError);
          setError("AI Agent connection failed. Trying to reconnect...");

          // Try to reconnect
          setTimeout(async () => {
            await handleReconnect();
          }, 1000);
        }
      } else {
        if (aiAgent?.processing) {
          setError("AI Agent is busy processing another request");
        } else {
          setError("AI Agent not connected");
        }
        console.warn("AI Agent not available:", {
          hasAgent: !!aiAgent,
          connected: connectionStatus,
          processing: aiAgent?.processing,
        });
      }

      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error("❌ Chatbot Error:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  // Handle click outside to close
  const handleClickOutside = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) {
    // Floating Button
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

  // Floating Input Box
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
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Sparkles className="text-blue-600" size={20} />
            </div>
            <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Assistant
            </h4>
            {/* Connection Status Indicator */}
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

              {/* Audio Playing Indicator */}
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

              {(connectionStatus === "disconnected" ||
                connectionStatus === "connecting") && (
                <button
                  onClick={handleReconnect}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Reconnect"
                  disabled={connectionStatus === "connecting"}
                >
                  <RefreshCw
                    size={12}
                    className={
                      connectionStatus === "connecting" ? "animate-spin" : ""
                    }
                  />
                </button>
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

            {/* Stop Audio Button */}
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

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Image Preview */}
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3">
          <div className="mb-3">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tanya tentang kebersihan lokasi, minta lihat detail, atau navigasi..."
              className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading || connectionStatus !== "connected"}
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
                disabled={isLoading || connectionStatus !== "connected"}
                title="Upload gambar"
              >
                <ImageIcon size={16} />
              </button>
            </div>

            <button
              type="submit"
              disabled={
                // Original conditions
                isLoading ||
                isProcessing ||
                connectionStatus !== "connected" ||
                // New condition: disable if image exists but no text query
                (selectedImage && !query.trim()) ||
                // Also disable if no input at all
                (!query.trim() && !selectedImage)
              }
              className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-1"
            >
              {isLoading || isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isProcessing ? "Processing..." : "Loading..."}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Kirim</span>
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
