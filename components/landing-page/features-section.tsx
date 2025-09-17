"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Map,
  Users,
  CheckCircle,
  BarChart3,
  Smartphone,
  Globe,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  iconBg: string;
  index: number;
  isVisible: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  bgColor,
  iconBg,
  index,
  isVisible,
}) => {
  return (
    <div
      className={`${bgColor} p-8 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col transition-all duration-800 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-95"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-6 transition-all duration-600 ${
          isVisible ? "scale-100 rotate-0" : "scale-0 rotate-12"
        }`}
        style={{ transitionDelay: `${index * 150 + 200}ms` }}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed flex-grow">{description}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cardsPerSlide, setCardsPerSlide] = useState(3);
  const [isVisible, setIsVisible] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // State untuk swipe gesture
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const features = [
    {
      icon: <Map className="w-8 h-8 text-white" />,
      title: "Pemetaan Interaktif",
      description:
        "Pelacakan lokasi real-time titik pengumpulan sampah dengan pembaruan status detail dan optimasi rute.",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-600",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: "Sistem Penilaian Cerdas",
      description:
        "Penilaian dan grading otomatis efisiensi pengumpulan sampah dengan analitik detail dan wawasan mendalam.",
      bgColor: "bg-teal-50",
      iconBg: "bg-teal-600",
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Real-time Mapping",
      description:
        "Peta interaktif untuk melacak lokasi dan status kebersihan secara real-time",
      bgColor: "bg-cyan-50",
      iconBg: "bg-cyan-600",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-white" />,
      title: "Comprehensive Reports",
      description:
        "Laporan detail dengan sistem grading A-D untuk monitoring yang lebih baik",
      bgColor: "bg-green-50",
      iconBg: "bg-green-600",
    },
    {
      icon: <Smartphone className="w-8 h-8 text-white" />,
      title: "Dioptimalkan Mobile",
      description:
        "Desain responsif penuh yang bekerja sempurna di semua perangkat untuk pekerja lapangan dan warga.",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-600",
    },
    {
      icon: <Globe className="w-8 h-8 text-white" />,
      title: "AI-Powered Analysis",
      description:
        "Analisis kebersihan otomatis menggunakan kecerdasan buatan dengan akurasi tinggi",
      bgColor: "bg-sky-50",
      iconBg: "bg-sky-600",
    },
  ];

  useEffect(() => {
    const updateCardsPerSlide = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerSlide(1);
      } else if (width < 1024) {
        setCardsPerSlide(2);
      } else {
        setCardsPerSlide(3);
      }
    };

    updateCardsPerSlide();
    window.addEventListener("resize", updateCardsPerSlide);
    return () => window.removeEventListener("resize", updateCardsPerSlide);
  }, []);

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

  const totalSlides = Math.ceil(features.length / cardsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === 0 && touchEndX === 0) return;
    const threshold = 50;

    if (touchEndX < touchStartX - threshold) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    } else if (touchEndX > touchStartX + threshold) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }

    setTouchStartX(0);
    setTouchEndX(0);
  };

  return (
    <section id="features" className="py-20 bg-gray-50" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-8">
          <div
            className={`inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-cyan-100 backdrop-blur-sm rounded-full px-6 py-2 border border-emerald-200/50 transition-all duration-800 ${
              isVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95"
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-medium font-bold text-emerald-700">
              Fitur Unggulan
            </span>
          </div>

          <h2
            className={`text-4xl lg:text-6xl font-black text-slate-900 leading-tight transition-all duration-1000 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Teknologi
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {" "}
              Revolusioner
            </span>
          </h2>

          <p
            className={`text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto transition-all duration-1000 delay-400 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Semua yang Anda butuhkan untuk mengelola pengumpulan sampah dengan
            <span className="font-bold text-emerald-600">
              {" "}
              teknologi AI terdepan
            </span>
          </p>
        </div>

        <div className="relative">
          {/* Slider Container */}
          <div
            className={`overflow-hidden transition-all duration-1000 delay-600 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={sliderRef}
              className={`flex transition-transform duration-700 ease-in-out`}
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex-shrink-0"
                  style={{ width: `${100 / cardsPerSlide}%` }}
                >
                  <div className="px-4 h-full">
                    <FeatureCard
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      bgColor={feature.bgColor}
                      iconBg={feature.iconBg}
                      index={index % cardsPerSlide}
                      isVisible={isVisible}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 z-10 hidden sm:flex transition-all duration-800 delay-800 hover:scale-110 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextSlide}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 z-10 hidden sm:flex transition-all duration-800 delay-800 hover:scale-110 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div
          className={`flex justify-center mt-12 space-x-2 transition-all duration-1000 delay-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                index === currentSlide ? "bg-emerald-600" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
