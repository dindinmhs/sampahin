"use client";

import React, { useState, useEffect } from "react";
import { Trophy, TrendingUp, MapPin } from "lucide-react";
import Link from "next/link";

interface TopCity {
  name: string;
  province: string;
  score: number;
  trend: "up" | "down" | "stable";
}

const topCities: TopCity[] = [
  { name: "Bandung", province: "Jawa Barat", score: 95.2, trend: "up" },
  { name: "Surabaya", province: "Jawa Timur", score: 92.8, trend: "up" },
  {
    name: "Yogyakarta",
    province: "DI Yogyakarta",
    score: 91.5,
    trend: "stable",
  },
];

export const LeaderboardPreview = () => {
  const [isVisible, setIsVisible] = useState(false);

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

    return () => observer.disconnect();
  }, []);

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

              <div className="space-y-4">
                {topCities.map((city, index) => (
                  <div
                    key={city.name}
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
                          {city.name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {city.province}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-600">
                        {city.score}
                      </span>
                      {city.trend === "up" && (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

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
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-lg">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-slate-800 mb-1">34</p>
                  <p className="text-slate-600">Provinsi</p>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-lg">
                <div className="text-center">
                  <Trophy className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-slate-800 mb-1">514</p>
                  <p className="text-slate-600">Kota/Kabupaten</p>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-cyan-200 shadow-lg col-span-2">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-cyan-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-slate-800 mb-1">
                    89.2%
                  </p>
                  <p className="text-slate-600">
                    Peningkatan Kebersihan Nasional
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-6 border border-emerald-200">
              <h4 className="font-semibold text-slate-800 mb-2">
                💡 Tahukah Kamu?
              </h4>
              <p className="text-slate-600 text-sm">
                Kota dengan skor kebersihan di atas 90 memiliki tingkat kepuasan
                masyarakat yang 40% lebih tinggi dan kualitas udara yang 25%
                lebih baik!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
