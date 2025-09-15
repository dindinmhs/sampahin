"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader2, ImageIcon } from "lucide-react";

interface ChatBotFloatingProps {
  isOpen: boolean;
  onToggle: () => void;
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
  search_mode: 'text' | 'image' | 'multimodal';
  embeddings_info: {
    text_embedding_length: number;
    image_embedding_length: number;
  };
}

const ChatBotInput = ({ isOpen, onToggle }: ChatBotFloatingProps) => {
  const [query, setQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedImage) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('query', query);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('/api/chatbot-rag', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const data: ChatResponse = await response.json();
      
      // Enhanced console logging
      console.log('=== SAMPAHIN AI CHATBOT RESULTS ===');
      console.log('🔍 Query:', query);
      console.log('🖼️ Has Image:', !!selectedImage);
      console.log('🤖 Search Mode:', data.search_mode);
      console.log('📊 Embeddings Info:');
      console.log('   - Text Embedding:', data.embeddings_info.text_embedding_length, 'dimensions');
      console.log('   - Image Embedding:', data.embeddings_info.image_embedding_length, 'dimensions');
      console.log('📍 RAG Results Count:', data.rag_results.length);
      console.log('');
      console.log('💬 AI Response:');
      console.log(data.message);
      console.log('');
      
      if (data.rag_results.length > 0) {
        console.log('📋 Detailed Location Results:');
        data.rag_results.forEach((result, index) => {
          console.log(`${index + 1}. 📍 ${result.location_name}`);
          console.log(`   🏆 Grade: ${result.grade} | Score: ${result.score}/100`);
          console.log(`   🎯 Type: ${result.type === 'clean' ? '✅ Bersih' : '❌ Kotor'}`);
          console.log(`   📈 Overall Similarity: ${(result.similarity_score * 100).toFixed(2)}%`);
          
          if (data.search_mode === 'multimodal') {
            if (result.text_similarity) {
              console.log(`   📝 Text Similarity: ${(result.text_similarity * 100).toFixed(2)}%`);
            }
            if (result.image_similarity) {
              console.log(`   🖼️ Image Similarity: ${(result.image_similarity * 100).toFixed(2)}%`);
            }
          }
          
          console.log(`   🌍 Location: ${result.city}, ${result.province}`);
          console.log(`   📌 Coordinates: [${result.lan.toFixed(4)}, ${result.lat.toFixed(4)}]`);
          console.log(`   📄 Description: ${result.ai_description.substring(0, 100)}${result.ai_description.length > 100 ? '...' : ''}`);
          console.log('   ────────────────────────────');
        });
      } else {
        console.log('❌ No matching locations found');
      }
      console.log('===================================');

      // Reset form after successful submission
      resetForm();
      
    } catch (error) {
      console.error('❌ Chatbot Error:', error);
    } finally {
      setIsLoading(false);
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
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-110"
          title="Tanya AI Assistant"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  // Floating Input Box
  return (
    <div className="fixed bottom-4 right-20 z-[60] w-80" onClick={handleClickOutside}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-blue-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="text-blue-600" size={20} />
            <h4 className="text-sm font-semibold text-gray-800">AI Assistant</h4>
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="p-3 border-b">
            <div className="relative inline-block">
              <img 
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
              placeholder="Tanya tentang kebersihan lokasi..."
              className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
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
              disabled={(!query.trim() && !selectedImage) || isLoading}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>...</span>
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

export default ChatBotInput;