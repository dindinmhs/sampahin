"use client";

import React from 'react';

import { CreativeArticle } from '@/types/scan';
import { Clock, ChefHat, Lightbulb, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface ArticleModalProps {
  article: CreativeArticle | null;
  waste: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticleModal({ article, waste, isOpen, onClose }: ArticleModalProps) {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto w-full shadow-2xl border border-gray-100">
        {/* Modal Header */}
        <div className="top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{article.title}</h1>
              <p className="text-emerald-100 mb-4 text-sm leading-relaxed">{article.description}</p>
              
              {/* Article Image */}
              {article.imageUrl && (
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover rounded-xl shadow-lg border-2 border-white/20"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{article.timeRequired}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <ChefHat className="h-4 w-4" />
                  <span className="font-medium">Kesulitan: {article.difficulty}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-white/5 rounded-full"></div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Materials Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              Bahan-bahan yang Diperlukan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {article.materials.map((material: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700 text-sm font-medium">{material}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tools Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
              Alat yang Dibutuhkan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {article.tools.map((tool: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200 shadow-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700 text-sm font-medium">{tool}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              Langkah-langkah Pembuatan
            </h2>
            <div className="space-y-4">
              {article.steps.map((step: string, index: number) => (
                <div key={index} className="flex gap-4 p-4 bg-white border border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed text-sm">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Tips & Trik
            </h2>
            <div className="space-y-3">
              {article.tips.map((tip: string, index: number) => (
                <div key={index} className="flex gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-r-2xl shadow-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 leading-relaxed text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final Result Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Hasil Akhir
            </h2>
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-sm">
              <p className="text-gray-700 leading-relaxed text-sm font-medium">{article.finalResult}</p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
              Manfaat & Keuntungan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {article.benefits.map((benefit: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              Kreasi dari sampah: <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs">{waste}</span>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}