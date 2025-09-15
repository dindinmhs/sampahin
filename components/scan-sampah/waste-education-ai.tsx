"use client";

import React from "react";
import {
  Recycle,
  Clock,
  DollarSign,
  Leaf,
  AlertTriangle,
  TrendingUp,
  Factory,
  Zap,
  Info,
} from "lucide-react";

// AI Education data interface
interface AIEducationData {
  title: string;
  description: string;
  environmentalImpact: {
    positive: string[];
    negative: string[];
  };
  recyclingProcess: {
    steps: string[];
    difficulty: string;
    timeRequired: string;
  };
  tips: {
    reduce: string[];
    reuse: string[];
    recycle: string[];
  };
  funFacts: string[];
  economicValue: {
    price: string;
    potential: string;
  };
  personalizedAdvice: string;
  generatedAt: string;
  wasteType: string;
  confidence: number;
  isfallback?: boolean;
}

interface WasteEducationProps {
  aiEducation?: AIEducationData | null;
}

export const WasteEducation: React.FC<WasteEducationProps> = ({
  aiEducation,
}) => {
  return (
    <div className="mt-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-8 h-8" />
            <div className="text-center">
              <h3 className="text-2xl font-bold">AI Education Hub</h3>
              <p className="text-emerald-100">Edukasi Mendalam dari AI</p>
            </div>
          </div>
        </div>

        {/* AI Content */}
        <div className="p-6">
          {!aiEducation ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Memuat Edukasi AI...
                </h3>
                <p className="text-slate-600">
                  Edukasi AI akan muncul otomatis setelah analisis selesai
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {aiEducation.title}
                    </h3>
                    <p className="text-slate-700 mb-3">
                      {aiEducation.description}
                    </p>
                  </div>
                  {aiEducation.isfallback && (
                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-1 text-xs text-yellow-800">
                      Fallback Mode
                    </div>
                  )}
                </div>
              </div>

              {/* Environmental Impact AI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5" />
                    Dampak Positif
                  </h4>
                  <ul className="space-y-2">
                    {aiEducation.environmentalImpact.positive.map(
                      (impact, index) => (
                        <li
                          key={index}
                          className="text-sm text-green-700 flex items-start gap-2"
                        >
                          <span className="text-green-500 text-lg leading-none">
                            •
                          </span>
                          {impact}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-6 border border-red-200">
                  <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Dampak Negatif
                  </h4>
                  <ul className="space-y-2">
                    {aiEducation.environmentalImpact.negative.map(
                      (impact, index) => (
                        <li
                          key={index}
                          className="text-sm text-red-700 flex items-start gap-2"
                        >
                          <span className="text-red-500 text-lg leading-none">
                            •
                          </span>
                          {impact}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* 3R Tips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4">
                    🔄 Reduce
                  </h4>
                  <ul className="space-y-2">
                    {aiEducation.tips.reduce.map((tip, index) => (
                      <li key={index} className="text-sm text-purple-700">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">
                    ♻️ Reuse
                  </h4>
                  <ul className="space-y-2">
                    {aiEducation.tips.reuse.map((tip, index) => (
                      <li key={index} className="text-sm text-blue-700">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-teal-100 rounded-xl p-6 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">
                    🔄 Recycle
                  </h4>
                  <ul className="space-y-2">
                    {aiEducation.tips.recycle.map((tip, index) => (
                      <li key={index} className="text-sm text-green-700">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recycling Process */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                  <Recycle className="w-5 h-5" />
                  Proses Daur Ulang AI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-indigo-800">
                      Waktu Dibutuhkan
                    </p>
                    <p className="text-xs text-indigo-600">
                      {aiEducation.recyclingProcess.timeRequired}
                    </p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-indigo-800">
                      Tingkat Kesulitan
                    </p>
                    <p className="text-xs text-indigo-600">
                      {aiEducation.recyclingProcess.difficulty}
                    </p>
                  </div>
                  <div className="text-center">
                    <Factory className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-indigo-800">
                      Langkah-langkah
                    </p>
                    <p className="text-xs text-indigo-600">
                      {aiEducation.recyclingProcess.steps.length} tahap
                    </p>
                  </div>
                </div>
                <ol className="space-y-2">
                  {aiEducation.recyclingProcess.steps.map((step, index) => (
                    <li
                      key={index}
                      className="text-sm text-indigo-700 flex items-start gap-2"
                    >
                      <span className="bg-indigo-200 text-indigo-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Fun Facts */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <h4 className="text-lg font-semibold text-yellow-800 mb-4">
                  🎯 Fakta Menarik
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiEducation.funFacts.map((fact, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-yellow-200"
                    >
                      <p className="text-sm text-yellow-800">{fact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Economic Value */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                <h4 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Nilai Ekonomi AI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-emerald-800 mb-2">
                      💰 Harga Pasar
                    </p>
                    <p className="text-emerald-700">
                      {aiEducation.economicValue.price}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800 mb-2">
                      📈 Potensi
                    </p>
                    <p className="text-emerald-700">
                      {aiEducation.economicValue.potential}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Advice */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
                <h4 className="text-lg font-semibold text-violet-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Saran Personal AI
                </h4>
                <p className="text-violet-700 leading-relaxed">
                  {aiEducation.personalizedAdvice}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
