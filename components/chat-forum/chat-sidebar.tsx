"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, AlertCircle } from "lucide-react";
import Avatar from "../common/avatar";
import { createClient } from "@/lib/supabase/client";

/**
 * Interface untuk data pesan chat
 */
interface Message {
  id: string;
  content: string;
  user_name: string;
  created_at: string;
  sender_id: string;
}

/**
 * Props untuk komponen ChatSidebar
 */
interface ChatSidebarProps {
  reportId: string;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Komponen ChatSidebar - Interface chat komunitas untuk setiap laporan kebersihan
 * Menampilkan pesan dengan layout modern: pesan sendiri di kanan (hijau), pesan lain di kiri (putih)
 */
export const ChatSidebar = ({
  reportId,
  locationName,
  isOpen,
  onClose,
}: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  /**
   * Mengecek status autentikasi pengguna saat ini
   */
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, [supabase]);

  /**
   * Mengambil daftar pesan chat dari server berdasarkan report_id
   * Pesan dari pengguna saat ini akan ditampilkan dengan nama "You"
   */
  const fetchMessages = async () => {
    if (!reportId) {
      setError("Report ID tidak tersedia");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chat?report_id=${reportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages");
      }

      // Update nama pengguna untuk pesan dari user saat ini
      const updatedMessages = (data.messages || []).map((message: Message) => {
        // Jika pesan dari pengguna saat ini, tampilkan sebagai "You"
        if (user && message.sender_id === user.id) {
          return {
            ...message,
            user_name: "You"
          };
        }
        // Untuk pengguna lain, gunakan nama yang sudah didapat dari server
        return message;
      });

      setMessages(updatedMessages);
    } catch (err) {
      setError("Gagal memuat pesan");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mengirim pesan baru ke server dan menambahkannya ke state lokal
   * Pesan akan langsung ditampilkan dengan nama "You" untuk pengguna saat ini
   */
  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !reportId) return;

    try {
      setSending(true);
      setError(null);

      const payload = {
        message: newMessage.trim(),
        report_id: reportId,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to send message`);
      }

      if (data.message) {
        const messageWithCorrectName = {
          ...data.message,
          user_name: "You"
        };
        
        setMessages(prev => [...prev, messageWithCorrectName]);
        setNewMessage("");
        
        // Refresh pesan dari server setelah delay singkat untuk mendapatkan update nama user lain
        setTimeout(() => {
          fetchMessages();
        }, 500);
      } else {
        setError("Pesan terkirim tapi tidak ada data response");
      }
    } catch (err) {
      setError(`Gagal mengirim pesan: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

 
  useEffect(() => {
    if (isOpen && reportId) {
      fetchMessages();
    }
  }, [isOpen, reportId, user]);

  /**
   * Auto scroll ke bawah saat ada pesan baru
   */
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  /**
   * Handler untuk mengirim pesan
   */
  const handleSendMessage = () => {
    sendMessage();
  };

  /**
   * Handler untuk keyboard shortcut (Enter untuk kirim)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-50">
        <div>
          <h2 className="text-lg font-bold text-green-800">Chat Komunitas</h2>
          <p className="text-sm text-green-600">{locationName}</p>
        </div>
        <button
          onClick={onClose}
          title="Tutup chat"
          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-green-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            <span className="ml-2 text-sm text-gray-600">Memuat pesan...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="ml-2 text-sm text-red-600">{error}</span>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-gray-500 mb-2">Belum ada pesan. Mulai percakapan!</p>
          </div>
        )}

        {!loading && messages.map((message) => {
          const isCurrentUser = user && message.sender_id === user.id;
          
          return (
            <div key={message.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar untuk pesan orang lain (kiri) */}
              {!isCurrentUser && (
                <Avatar displayName={message.user_name} size="sm" className="mb-1" />
              )}
              
              <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-xs`}>
                {/* Header dengan nama dan waktu */}
                <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <span className="font-semibold text-xs text-gray-600">
                    {message.user_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                
                {/* Bubble pesan */}
                <div className={`p-3 rounded-2xl shadow-sm ${
                  isCurrentUser 
                    ? 'bg-green-500 text-white rounded-br-md' 
                    : 'bg-white text-gray-800 rounded-bl-md border'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
              
              {/* Avatar untuk pesan sendiri (kanan) */}
              {isCurrentUser && (
                <Avatar displayName={message.user_name} size="sm" className="mb-1" />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={user ? "Ketikan Pesan" : "Ketikan Pesan (Anonymous)"}
            className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            title={sending ? "Mengirim..." : "Kirim pesan"}
            className={`p-3 rounded-full ${
              newMessage.trim() && !sending
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300 cursor-not-allowed"
            } text-white transition-colors`}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
