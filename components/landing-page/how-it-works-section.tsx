"use client";

import React, { useEffect, useState, useRef } from "react";
import { Camera, Brain, Share, Sparkles } from "lucide-react";

interface WorkflowStepProps {
  step: {
    number: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    bgColor: string;
  };
  index: number;
  totalSteps: number;
  isVisible: boolean;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({
  step,
  index,
  totalSteps,
  isVisible,
}) => {
  return (
    <div className="relative group">
      <div
        className={`relative overflow-hidden border-0 bg-gradient-to-br ${
          step.bgColor
        } shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 hover:scale-102 rounded-2xl ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-12 scale-90"
        }`}
        style={{ transitionDelay: `${index * 200}ms` }}
      >
        <div className="p-6 space-y-6 text-center relative z-10">
          {/* Step Number */}
          <div className="relative mx-auto">
            <div
              className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${
                step.color
              } flex items-center justify-center text-white shadow-xl relative z-10 group-hover:scale-110 transition-all duration-500 ${
                isVisible ? "scale-100 rotate-0" : "scale-0 rotate-180"
              }`}
              style={{ transitionDelay: `${index * 200 + 300}ms` }}
            >
              <span className="text-lg font-black">{step.number}</span>
            </div>

            {/* Pulsing Ring */}
            <div
              className={`absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${
                step.color
              } opacity-20 animate-ping transition-opacity duration-500 ${
                isVisible ? "opacity-20" : "opacity-0"
              }`}
              style={{ transitionDelay: `${index * 200 + 500}ms` }}
            ></div>
          </div>

          {/* Icon */}
          <div
            className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${
              step.color
            } flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all duration-500 ${
              isVisible ? "scale-100 rotate-0" : "scale-0 -rotate-90"
            }`}
            style={{ transitionDelay: `${index * 200 + 400}ms` }}
          >
            <div className="w-6 h-6">{step.icon}</div>
          </div>

          {/* Content */}
          <div
            className={`space-y-3 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${index * 200 + 600}ms` }}
          >
            <h3 className="text-xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">
              {step.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        {/* Animated Background */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${step.color} transition-opacity duration-500`}
        ></div>
      </div>

      {/* Step Connector for Mobile */}
      {index < totalSteps - 1 && (
        <div
          className={`lg:hidden flex justify-center mt-6 transition-all duration-600 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
          style={{ transitionDelay: `${index * 200 + 800}ms` }}
        >
          <div
            className={`w-1 h-8 bg-gradient-to-b ${step.color} rounded-full`}
          ></div>
        </div>
      )}
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
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

  const steps = [
    {
      number: "01",
      icon: <Camera className="w-6 h-6" />,
      title: "Capture & Upload",
      description:
        "Ambil foto lokasi dengan smartphone. AI kami akan otomatis mendeteksi dan menganalisis kondisi tempat.",
      color: "from-emerald-400 via-teal-500 to-cyan-500",
      bgColor: "from-emerald-50 to-teal-50",
    },
    {
      number: "02",
      icon: <Brain className="w-6 h-6" />,
      title: "AI Processing",
      description:
        "Sistem AI akan menganalisis gambar, mengidentifikasi tempat, dan memberikan skor kebersihan otomatis.",
      color: "from-teal-400 via-cyan-500 to-blue-500",
      bgColor: "from-teal-50 to-cyan-50",
    },
    {
      number: "03",
      icon: <Share className="w-6 h-6" />,
      title: "Share Insights",
      description:
        "Data tersinkronisasi ke peta real-time, laporan otomatis dibuat, dan lokasi dapat dibagikan ke peta.",
      color: "from-cyan-400 via-blue-500 to-indigo-500",
      bgColor: "from-cyan-50 to-blue-50",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 relative overflow-hidden"
      ref={sectionRef}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-cyan-50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div
            className={`absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-emerald-300 to-teal-300 rounded-full blur-3xl animate-pulse transition-all duration-1000 ${
              isVisible ? "opacity-20 scale-100" : "opacity-0 scale-50"
            }`}
          ></div>
          <div
            className={`absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl transition-all duration-1200 delay-300 ${
              isVisible ? "opacity-20 scale-100" : "opacity-0 scale-50"
            }`}
          ></div>
        </div>

        {/* Geometric Shapes */}
        <div
          className={`absolute top-40 right-40 w-20 h-20 border-4 border-emerald-300/50 rotate-45 animate-spin transition-all duration-800 delay-500 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
          style={{ animationDuration: "15s" }}
        ></div>
        <div
          className={`absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rotate-12 animate-bounce transition-all duration-800 delay-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
        ></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <div
            className={`inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-cyan-100 backdrop-blur-sm rounded-full px-6 py-2 border border-emerald-200/50 transition-all duration-800 ${
              isVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-medium font-bold text-emerald-700">
              Cara Kerja
            </span>
          </div>

          <h2
            className={`text-4xl lg:text-5xl font-black text-slate-900 leading-tight transition-all duration-1000 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              3 Langkah
            </span>
            <br />
            Mudah
          </h2>

          <p
            className={`text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Transformasi monitoring sampah hanya dalam 3 langkah sederhana
            dengan teknologi AI terdepan
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div
            className={`hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 rounded-full mx-16 transition-all duration-1000 delay-600 ${
              isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`}
          ></div>

          <div
            className={`grid lg:grid-cols-3 gap-8 relative transition-all duration-1000 delay-800 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {steps.map((step, index) => (
              <WorkflowStep
                key={index}
                step={step}
                index={index}
                totalSteps={steps.length}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
