"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import Avatar from "../common/avatar";

interface Message {
  id: string;
  content: string;
  user_name: string;
  created_at: string;
}

interface ChatSidebarProps {
  locationId: string;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSidebar = ({
  locationId,
  locationName,
  isOpen,
  onClose,
}: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([
    // ... existing code ...
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pindahkan useEffect ke sini, sebelum conditional return
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Jika tidak terbuka, jangan render apa-apa
  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    // Simulasi pengiriman pesan tanpa database
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      user_name: "You", // Nama pengguna statis untuk UI
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

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
          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-green-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <Avatar displayName={message.user_name} size="sm" />
            <div className="flex-1">
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-sm">
                  {message.user_name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="mt-1 bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-800">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ketikan Pesan"
            className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full ${
              newMessage.trim()
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300 cursor-not-allowed"
            } text-white`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
