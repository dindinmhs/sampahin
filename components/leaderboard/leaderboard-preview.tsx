"use client";

import React, { useState, useEffect } from "react";
import { Trophy, TrendingUp, MapPin, Users } from "lucide-react";
import Link from "next/link";

interface TopCity {
  city: string;
  province: string;
  avgScore: number;
  totalReports: number;
  rank: number;
}

interface LeaderboardStats {
  totalUsers: number;
  totalPoints: number;
  totalMissions: number;
  avgPointsPerUser: number;
}

export const LeaderboardPreview = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [topCities, setTopCities] = useState<TopCity[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("leaderboard-preview");
    if (element) observer.observe(element);

    // Fetch data
    fetchLeaderboardData();

    return () => observer.disconnect();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Fetch city leaderboard
      const citiesResponse = await fetch("/api/leaderboard/cities");

      // Check if response is ok and content-type is JSON
      if (!citiesResponse.ok) {
        throw new Error(`Cities API error: ${citiesResponse.status}`);
      }

      const citiesContentType = citiesResponse.headers.get("content-type");
      if (
        !citiesContentType ||
        !citiesContentType.includes("application/json")
      ) {
        throw new Error("Cities API returned non-JSON response");
      }

      const citiesResult = await citiesResponse.json();

      // Fetch user leaderboard stats
      const usersResponse = await fetch("/api/leaderboard");

      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status}`);
      }

      const usersContentType = usersResponse.headers.get("content-type");
      if (!usersContentType || !usersContentType.includes("application/json")) {
        throw new Error("Users API returned non-JSON response");
      }

      const usersResult = await usersResponse.json();

      if (citiesResult.success) {
        // Get top 3 cities
        const top3 = citiesResult.data.slice(0, 3);
        setTopCities(top3);
      }

      if (usersResult.success) {
        setStats(usersResult.stats);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard data:", err);
      // Set empty data on error to prevent UI issues
      setTopCities([]);
      setStats({
        totalUsers: 0,
        totalPoints: 0,
        totalMissions: 0,
        avgPointsPerUser: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="leaderboard-preview"
      className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center mb-12 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Kota Terbersih Indonesia
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Lihat peringkat kota-kota dengan kebersihan terbaik berdasarkan
            laporan komunitas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Top Cities List */}
          <div
            className={`transition-all duration-1000 delay-500 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-emerald-200 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h3 className="text-2xl font-bold text-slate-800">
                  Top 3 Kota Terbersih
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Memuat data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topCities.map((city, index) => (
                    <div
                      key={`${city.city}-${city.province}`}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : "bg-amber-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">
                            {city.city}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {city.province}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-emerald-600">
                          {city.avgScore.toFixed(1)}
                        </span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  ))}

                  {topCities.length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-500">
                      Belum ada data kota tersedia
                    </div>
                  )}
                </div>
              )}

              <Link
                href="/leaderboard"
                className="block mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-200"
              >
                Lihat Semua Peringkat
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div
            className={`transition-all duration-1000 delay-700 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }`}
          >
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Memuat statistik...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-lg">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-slate-800 mb-1">
                      {topCities.length}
                    </p>
                    <p className="text-slate-600">Kota Aktif</p>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-lg">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-slate-800 mb-1">
                      {stats?.totalUsers || 0}
                    </p>
                    <p className="text-slate-600">User Aktif</p>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-cyan-200 shadow-lg col-span-2">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-cyan-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-slate-800 mb-1">
                      {stats?.totalMissions || 0}
                    </p>
                    <p className="text-slate-600">Total Misi Selesai</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-6 border border-emerald-200">
              <h4 className="font-semibold text-slate-800 mb-2">
                💡 Statistik Real-time
              </h4>
              <p className="text-slate-600 text-sm">
                {stats
                  ? `Total poin terkumpul: ${stats.totalPoints.toLocaleString()} | 
                   Rata-rata poin per user: ${stats.avgPointsPerUser}`
                  : "Data leaderboard diperbarui secara real-time berdasarkan aktivitas komunitas dan laporan kebersihan."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
