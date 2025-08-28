"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Smartphone } from "lucide-react";

const AppShowcaseSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for fade in effect
  useEffect(() => {
    const currentSection = sectionRef.current; // ✅ Copy ref to variable

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  return (
    <section
      id="mobile-app"
      className="py-20 relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-cyan-900"
      ref={sectionRef}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div
          className={`absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl transition-all duration-1000 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        ></div>
        <div
          className={`absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl transition-all duration-1200 delay-300 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        ></div>

        {/* Floating Dots */}
        <div
          className={`absolute top-1/4 right-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-ping transition-all duration-800 delay-500 ${
            isVisible ? "opacity-60" : "opacity-0"
          }`}
        ></div>
        <div
          className={`absolute bottom-1/3 left-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse transition-all duration-800 delay-700 ${
            isVisible ? "opacity-40" : "opacity-0"
          }`}
        ></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white">Mobile App</span>
            </div>

            {/* Heading */}
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                Monitoring
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Dalam Genggaman
                </span>
              </h2>

              <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                Akses platform monitoring sampah{" "}
                <span className="font-bold text-white">
                  kapan saja, di mana saja
                </span>{" "}
                dengan aplikasi mobile yang dioptimalkan untuk petugas lapangan
                dan masyarakat.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 text-white">
              {[
                "📱 Interface yang responsif dan user-friendly",
                "📍 GPS tracking real-time untuk lokasi akurat",
                "📸 Upload foto langsung dengan AI analysis",
                "🗺️ Peta yang interaktif dan informatif",
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 transition-all duration-600 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <span className="text-lg">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Mobile Preview */}
          <div
            className={`relative transition-all duration-1200 delay-300 ${
              isVisible
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 translate-x-8 scale-90"
            }`}
          >
            <div className="relative flex justify-center items-center">
              {/* Main Phone (Center) */}
              <div className="relative z-10 transform">
                <div className="w-72 h-[580px] bg-black rounded-[3rem] p-2 shadow-2xl">
                  <div className="w-full h-full bg-gray-900 rounded-[2.5rem] overflow-hidden relative">
                    <Image
                      src="/mobile.png"
                      alt="Sampahin Mobile App"
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* Notch */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10"></div>
                  </div>
                </div>
              </div>

              {/* Left Phone */}
              <div
                className={`absolute left-0 top-8 transform -rotate-12 transition-all duration-800 delay-500 ${
                  isVisible
                    ? "translate-x-0 opacity-80"
                    : "-translate-x-12 opacity-0"
                }`}
              >
                <div className="w-56 h-[450px] bg-black rounded-[2.5rem] p-2 shadow-xl">
                  <div className="w-full h-full bg-gray-900 rounded-[2rem] overflow-hidden relative">
                    <Image
                      src="/mobile2.png"
                      alt="Sampahin Mobile App"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-black rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Right Phone */}
              <div
                className={`absolute right-0 top-8 transform rotate-12 transition-all duration-800 delay-700 ${
                  isVisible
                    ? "translate-x-0 opacity-80"
                    : "translate-x-12 opacity-0"
                }`}
              >
                <div className="w-56 h-[450px] bg-black rounded-[2.5rem] p-2 shadow-xl">
                  <div className="w-full h-full bg-gray-900 rounded-[2rem] overflow-hidden relative">
                    <Image
                      src="/mobile3.png"
                      alt="Sampahin Mobile App"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-black rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppShowcaseSection;
