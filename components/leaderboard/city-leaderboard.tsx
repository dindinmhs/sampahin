"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, MapPin, Users, BarChart3 } from "lucide-react";

// Real data types from API
interface CityData {
  city: string;
  province: string;
  avgScore: number;
  rank: number;
  displayRank?: number; // For tab-specific ranking
}

export const CityLeaderboard = () => {
  const [activeTab, setActiveTab] = useState<"cleanest" | "dirtiest">(
    "cleanest"
  );
  const [isVisible, setIsVisible] = useState(false);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    fetchCityData();
  }, []);

  const fetchCityData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/leaderboard/cities");
      const result = await response.json();

      if (result.success) {
        setCities(result.data);
      } else {
        setError(result.error || "Failed to fetch city data");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Failed to fetch city data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sort cities for different tabs with proper ranking
  const cleanestCities = [...cities]
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((city, index) => ({ ...city, displayRank: index + 1 }));

  const dirtiestCities = [...cities]
    .sort((a, b) => a.avgScore - b.avgScore)
    .map((city, index) => ({ ...city, displayRank: index + 1 }));

  const displayCities =
    activeTab === "cleanest" ? cleanestCities : dirtiestCities;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full text-sm font-medium">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-white border border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading leaderboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
            <button
              onClick={fetchCityData}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Leaderboard Kota
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Ranking kota berdasarkan kebersihan lingkungan dan kontribusi
            masyarakat dalam menjaga kelestarian alam
          </p>
        </div>

        {/* Statistics Cards */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-xl">
            <div className="flex items-center gap-4">
              <MapPin className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {cities.length}
                </p>
                <p className="text-slate-600">Kota Terdaftar</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-xl">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-teal-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {displayCities.length}
                </p>
                <p className="text-slate-600">Kota Aktif</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-xl">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-cyan-600" />
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {cities.length > 0
                    ? Math.round(
                        cities.reduce(
                          (sum: number, city: CityData) => sum + city.avgScore,
                          0
                        ) / cities.length
                      )
                    : 0}
                </p>
                <p className="text-slate-600">Rata-rata Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex justify-center mb-8 transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-emerald-200 shadow-xl">
            <button
              onClick={() => setActiveTab("cleanest")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === "cleanest"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-emerald-50"
              }`}
            >
              🏆 Terbersih
            </button>
            <button
              onClick={() => setActiveTab("dirtiest")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === "dirtiest"
                  ? "bg-red-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-red-50"
              }`}
            >
              ⚠️ Perlu Perhatian
            </button>
          </div>
        </div>

        {/* Leaderboard Cards */}
        <div
          className={`space-y-4 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {displayCities.map((city, index) => (
            <div
              key={`${city.city}-${city.province}`}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      (city.displayRank || city.rank) === 1
                        ? "bg-yellow-500"
                        : (city.displayRank || city.rank) === 2
                        ? "bg-gray-400"
                        : (city.displayRank || city.rank) === 3
                        ? "bg-amber-600"
                        : "bg-slate-400"
                    }`}
                  >
                    {city.displayRank || city.rank}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {city.city}
                    </h3>
                    <p className="text-slate-600">{city.province}</p>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {city.avgScore.toFixed(1)}
                  </span>
                  <p className="text-sm text-slate-600">Score</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayCities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Tidak ada data tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
};
