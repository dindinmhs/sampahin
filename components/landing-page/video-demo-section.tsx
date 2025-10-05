"use client";

import React, { useEffect, useState } from "react";
import { Play, Sparkles } from "lucide-react";

const VideoDemoSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("demo-video");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="demo-video"
      className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 max-w-7xl">
        {/* Header */}
        <div
          className={`text-center mb-12 lg:mb-16 space-y-4 transition-all duration-1000 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-200/50">
            <Play className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">
              Video Demo
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900">
            Lihat{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Sampahin
            </span>{" "}
            Beraksi
          </h2>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tonton bagaimana teknologi AI kami membantu memantau dan menganalisis
            kebersihan lingkungan secara real-time
          </p>
        </div>

        {/* Video Container */}
        <div
          className={`relative max-w-5xl mx-auto transition-all duration-1200 delay-300 ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          {/* Video Wrapper with Gradient Border */}
          <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-1 rounded-3xl shadow-2xl">
            <div className="bg-white rounded-[22px] p-4 sm:p-6">
              {/* 16:9 Aspect Ratio Container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/uxK-B1WQuxI?si=988EPrUXd-Fg57BV"
                  title="Sampahin Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

          {/* Floating Decorative Elements */}
          <div
            className={`absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg animate-bounce transition-all duration-800 delay-500 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <div
            className={`absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl shadow-lg rotate-12 transition-all duration-800 delay-700 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
            }`}
          ></div>

          <div
            className={`absolute top-1/2 -right-8 w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full shadow-lg animate-pulse transition-all duration-800 delay-900 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
            }`}
          ></div>
        </div>

        {/* Bottom Stats */}
        <div
          className={`flex flex-wrap justify-center gap-8 mt-12 lg:mt-16 transition-all duration-1000 delay-600 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600">500K+</div>
            <div className="text-sm text-slate-600">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-teal-600">4.9/5</div>
            <div className="text-sm text-slate-600">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-cyan-600">1M+</div>
            <div className="text-sm text-slate-600">Impressions</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoDemoSection;