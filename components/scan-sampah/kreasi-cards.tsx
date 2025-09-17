"use client";

import React, { useState } from "react";
import {
  Clock,
  ArrowRight,
} from "lucide-react";
import { CreativeArticle } from "@/types/scan";
import ArticleModal from "@/components/kreasi/article-modal";
import Image from "next/image";

interface KreasiCardsProps {
  articles?: CreativeArticle[] | null;
  wasteObject?: string;
}

export const KreasiCards: React.FC<KreasiCardsProps> = ({
  articles,
  wasteObject,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<CreativeArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (articleId: number) => {
    const article = articles?.find((article) => article.id === articleId);
    if (article) {
      setSelectedArticle(article);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "mudah":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "sedang":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "sulit":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  // Karena komponen ini hanya di-render ketika sudah ada articles,
  // kita tidak perlu empty state lagi
  if (!articles || articles.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8">
      <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-lg border border-emerald-100 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative text-center">
            <h3 className="text-2xl font-bold mb-1">✨ Kreasi DIY</h3>
            <p className="text-emerald-100 text-sm">
              {articles.length} ide kreatif dari {wasteObject || "sampah Anda"}
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>
        </div>

        {/* Articles Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-emerald-200 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
                onClick={() => handleCardClick(article.id)}
              >
                {/* Generated Image */}
                {article.imageUrl && (
                  <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <Image
                      src={article.imageUrl} 
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        // Hide image if it fails to load
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}

                <div className="p-5">
                  {/* Card Header */}
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-lg leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                  {/* Meta Info */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getDifficultyColor(
                        article.difficulty
                      )} shadow-sm`}
                    >
                      {article.difficulty}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{article.timeRequired}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">{article.steps.length} langkah</span>
                    <div className="flex items-center gap-1 text-emerald-600 group-hover:text-emerald-700">
                      <span className="text-sm font-medium">Lihat Detail</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          {articles.length > 6 && (
            <div className="text-center mt-8">
              <button className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Lihat Semua Kreasi ({articles.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        waste={wasteObject || ""}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};