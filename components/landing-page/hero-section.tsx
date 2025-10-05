"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Play, Sparkles, Zap } from "lucide-react";

const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade in animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Smooth scroll to demo video section
  const scrollToDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const demoSection = document.getElementById("demo-video");
    if (demoSection) {
      demoSection.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }
  };

  return (
    <section id="beranda" className="relative py-8 overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-2xl opacity-40"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-teal-400 to-sky-500 rounded-full blur-xl opacity-50 animate-bounce"></div>

        {/* Geometric Shapes */}
        <div
          className="absolute top-32 right-1/4 w-16 h-16 border-4 border-emerald-400/30 rotate-45 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div className="absolute bottom-32 right-16 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-500 rotate-12 animate-pulse"></div>
      </div>

      {/* Main Container with Better Spacing */}
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 lg:pr-8 xl:pr-12 transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge */}
            <div
              className={`inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-cyan-100 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-200/50 transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">
                AI-Powered Monitoring
              </span>
            </div>

            <div className="space-y-6">
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight transition-all duration-1000 delay-300 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <span className="text-slate-900">Revolusi</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Monitoring
                </span>
                <br />
                <span className="text-slate-900">Sampah</span>
              </h1>

              <p
                className={`text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg transition-all duration-1000 delay-500 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                Platform revolusioner untuk
                <span className="font-semibold text-emerald-600">
                  {" "}
                  memantau, menganalisis, dan melaporkan
                </span>{" "}
                kondisi kebersihan lingkungan secara real-time menggunakan
                teknologi AI terdepan.
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <Link
                href="/map"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white border-0 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 text-lg font-bold px-8 py-4 group"
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Mulai Gratis
              </Link>

              {/* ✅ Updated button dengan smooth scroll */}
              <a
                href="#demo-video"
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg font-bold px-8 py-4 group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Lihat Demo
              </a>
            </div>

            {/* ...existing stats code... */}
            <div
              className={`flex items-center space-x-6 sm:space-x-8 pt-4 transition-all duration-1000 delay-900 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-600">
                  1000+
                </div>
                <div className="text-sm text-slate-600">Kota</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-teal-600">
                  50M+
                </div>
                <div className="text-sm text-slate-600">Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-cyan-600">
                  99%
                </div>
                <div className="text-sm text-slate-600">Akurasi</div>
              </div>
            </div>
          </div>

          {/* ...existing right content code... */}
          <div
            className={`relative px-4 sm:px-6 lg:px-0 transition-all duration-1200 delay-400 ${
              isVisible
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 translate-x-8 scale-95"
            }`}
          >
            <div className="relative">
              {/* Main Dashboard */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-200/50 p-2 sm:p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl overflow-hidden relative">
                  <Image
                    src="/map-hero.png"
                    alt="Map Background"
                    fill
                    className="w-full h-full object-cover"
                    priority
                  />

                  {/* Overlay Elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-cyan-900/10"></div>

                  {/* Floating Stats */}
                  <div
                    className={`absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg transition-all duration-800 delay-1000 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-4"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        Live Active
                      </span>
                    </div>
                  </div>

                  <div
                    className={`absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg transition-all duration-800 delay-1200 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-4"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold text-emerald-600">
                      AI Score: 94%
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg transition-all duration-800 delay-1400 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    <div className="text-xs text-slate-600">
                      Lokasi Dipantau
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      2,847
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements Around Dashboard */}
              <div
                className={`absolute -top-6 -left-6 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg animate-bounce transition-all duration-800 delay-600 ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              ></div>
              <div
                className={`absolute -bottom-6 -right-6 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl shadow-lg rotate-12 hover:rotate-0 transition-all duration-800 delay-800 ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              ></div>
              <div
                className={`absolute top-1/2 -right-6 sm:-right-8 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full shadow-lg animate-pulse transition-all duration-800 delay-1000 ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;