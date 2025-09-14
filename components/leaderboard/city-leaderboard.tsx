"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  Recycle,
} from "lucide-react";

// Dummy data types
interface CityData {
  id: string;
  name: string;
  province: string;
  cleanlinessScore: number;
  totalReports: number;
  population: number;
  wasteProcessed: number;
  trend: "up" | "down" | "stable";
  lastUpdated: string;
}

// Dummy data
const dummyCities: CityData[] = [
  {
    id: "1",
    name: "Bandung",
    province: "Jawa Barat",
    cleanlinessScore: 95.2,
    totalReports: 1456,
    population: 2500000,
    wasteProcessed: 850,
    trend: "up",
    lastUpdated: "2 jam lalu",
  },
  {
    id: "2",
    name: "Surabaya",
    province: "Jawa Timur",
    cleanlinessScore: 92.8,
    totalReports: 1342,
    population: 2800000,
    wasteProcessed: 780,
    trend: "up",
    lastUpdated: "1 jam lalu",
  },
  {
    id: "3",
    name: "Yogyakarta",
    province: "DI Yogyakarta",
    cleanlinessScore: 91.5,
    totalReports: 987,
    population: 400000,
    wasteProcessed: 320,
    trend: "stable",
    lastUpdated: "3 jam lalu",
  },
  {
    id: "4",
    name: "Semarang",
    province: "Jawa Tengah",
    cleanlinessScore: 89.3,
    totalReports: 876,
    population: 1600000,
    wasteProcessed: 560,
    trend: "up",
    lastUpdated: "1 jam lalu",
  },
  {
    id: "5",
    name: "Malang",
    province: "Jawa Timur",
    cleanlinessScore: 87.9,
    totalReports: 654,
    population: 850000,
    wasteProcessed: 290,
    trend: "down",
    lastUpdated: "4 jam lalu",
  },
  {
    id: "6",
    name: "Jakarta",
    province: "DKI Jakarta",
    cleanlinessScore: 85.1,
    totalReports: 2145,
    population: 10500000,
    wasteProcessed: 1200,
    trend: "up",
    lastUpdated: "30 menit lalu",
  },
  {
    id: "7",
    name: "Medan",
    province: "Sumatera Utara",
    cleanlinessScore: 82.4,
    totalReports: 432,
    population: 2200000,
    wasteProcessed: 380,
    trend: "stable",
    lastUpdated: "2 jam lalu",
  },
  {
    id: "8",
    name: "Palembang",
    province: "Sumatera Selatan",
    cleanlinessScore: 78.6,
    totalReports: 298,
    population: 1600000,
    wasteProcessed: 220,
    trend: "down",
    lastUpdated: "5 jam lalu",
  },
];

export const CityLeaderboard = () => {
  const [activeTab, setActiveTab] = useState<"cleanest" | "dirtiest">(
    "cleanest"
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Sort cities for different tabs
  const cleanestCities = [...dummyCities].sort(
    (a, b) => b.cleanlinessScore - a.cleanlinessScore
  );
  const dirtiestCities = [...dummyCities].sort(
    (a, b) => a.cleanlinessScore - b.cleanlinessScore
  );

  const currentData =
    activeTab === "cleanest" ? cleanestCities : dirtiestCities;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return (
      <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-slate-600">
        {index + 1}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 border-emerald-200";
    if (score >= 80) return "bg-yellow-100 border-yellow-200";
    if (score >= 70) return "bg-orange-100 border-orange-200";
    return "bg-red-100 border-red-200";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === "down")
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-slate-400 rounded-full" />;
  };

  return (
    <div
      className={`max-w-6xl mx-auto px-4 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
          Leaderboard Kota
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Pantau peringkat kebersihan kota-kota di Indonesia berdasarkan laporan
          komunitas dan analisis AI
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {dummyCities.length}
              </p>
              <p className="text-slate-600">Kota Terpantau</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {dummyCities
                  .reduce((sum, city) => sum + city.totalReports, 0)
                  .toLocaleString()}
              </p>
              <p className="text-slate-600">Total Laporan</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-cyan-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <Recycle className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {dummyCities
                  .reduce((sum, city) => sum + city.wasteProcessed, 0)
                  .toLocaleString()}{" "}
                ton
              </p>
              <p className="text-slate-600">Sampah Diproses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-slate-200 shadow-lg">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("cleanest")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "cleanest"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              🏆 Kota Terbersih
            </button>
            <button
              onClick={() => setActiveTab("dirtiest")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "dirtiest"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-200"
                  : "text-slate-600 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              ⚠️ Perlu Perbaikan
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Peringkat
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Kota
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Skor Kebersihan
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Total Laporan
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Populasi
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Sampah Diproses
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Tren
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Update Terakhir
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((city, index) => (
                <tr
                  key={city.id}
                  className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-300 ${
                    index < 3
                      ? "bg-gradient-to-r from-yellow-50/30 to-amber-50/30"
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <span className="font-semibold text-slate-700">
                        #{index + 1}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {city.name}
                      </p>
                      <p className="text-sm text-slate-500">{city.province}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-lg border ${getScoreBgColor(
                        city.cleanlinessScore
                      )}`}
                    >
                      <span
                        className={`text-lg font-bold ${getScoreColor(
                          city.cleanlinessScore
                        )}`}
                      >
                        {city.cleanlinessScore.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-700">
                      {city.totalReports.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="text-slate-600">
                      {(city.population / 1000000).toFixed(1)}M
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-emerald-600">
                      {city.wasteProcessed} ton
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {getTrendIcon(city.trend)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-slate-500">
                      {city.lastUpdated}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          <div className="p-4 space-y-4">
            {currentData.map((city, index) => (
              <div
                key={city.id}
                className={`bg-white/80 rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                  index < 3 ? "ring-2 ring-yellow-200" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getRankIcon(index)}
                    <div>
                      <p className="font-semibold text-slate-800">
                        {city.name}
                      </p>
                      <p className="text-sm text-slate-500">{city.province}</p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg border ${getScoreBgColor(
                      city.cleanlinessScore
                    )}`}
                  >
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        city.cleanlinessScore
                      )}`}
                    >
                      {city.cleanlinessScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Laporan</p>
                    <p className="font-semibold text-slate-700">
                      {city.totalReports.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Populasi</p>
                    <p className="font-semibold text-slate-700">
                      {(city.population / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sampah Diproses</p>
                    <p className="font-semibold text-emerald-600">
                      {city.wasteProcessed} ton
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tren</p>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(city.trend)}
                      <span className="text-xs text-slate-500">
                        {city.lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
          <p className="text-slate-600 mb-2">
            <strong>Catatan:</strong> Data leaderboard diperbarui setiap 30
            menit berdasarkan laporan komunitas terbaru
          </p>
          <p className="text-sm text-slate-500">
            Skor kebersihan dihitung berdasarkan analisis AI dari foto laporan,
            frekuensi laporan, dan efektivitas penanganan sampah
          </p>
        </div>
      </div>
    </div>
  );
};
