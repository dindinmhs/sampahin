"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MapPin,
  Users,
  CheckCircle,
  BarChart3,
  Smartphone,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  iconBg: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  bgColor,
  iconBg,
}) => {
  return (
    <div
      className={`${bgColor} p-8 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col`}
    >
      <div
        className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-6`}
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
  const sliderRef = useRef<HTMLDivElement>(null);

  // State untuk swipe gesture
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const features = [
    {
      icon: <MapPin className="w-8 h-8 text-white" />,
      title: "Pemetaan Interaktif",
      description:
        "Pelacakan lokasi real-time titik pengumpulan sampah dengan pembaruan status detail dan optimasi rute.",
      bgColor: "bg-slate-50",
      iconBg: "bg-emerald-600",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: "Sistem Penilaian Cerdas",
      description:
        "Penilaian dan grading otomatis efisiensi pengumpulan sampah dengan analitik detail dan wawasan mendalam.",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-600",
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Real-time Mapping",
      description:
        "Peta interaktif untuk melacak lokasi dan status kebersihan secara real-time",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-600",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-white" />,
      title: "Comprehensive Reports",
      description:
        "Laporan detail dengan sistem grading A-E untuk monitoring yang lebih baik",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-600",
    },
    {
      icon: <Smartphone className="w-8 h-8 text-white" />,
      title: "Dioptimalkan Mobile",
      description:
        "Desain responsif penuh yang bekerja sempurna di semua perangkat untuk pekerja lapangan dan warga.",
      bgColor: "bg-red-50",
      iconBg: "bg-red-600",
    },
    {
      icon: <Globe className="w-8 h-8 text-white" />,
      title: "AI-Powered Analysis",
      description:
        "Analisis kebersihan otomatis menggunakan kecerdasan buatan dengan akurasi tinggi",
      bgColor: "bg-teal-50",
      iconBg: "bg-teal-600",
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

  const totalSlides = Math.ceil(features.length / cardsPerSlide);

  // Bagian ini dihapus untuk menghilangkan auto-slide:
  // useEffect(() => {
  //   const slideInterval = setInterval(() => {
  //     setCurrentSlide((prev) => (prev + 1) % totalSlides);
  //   }, 4000);

  //   return () => clearInterval(slideInterval);
  // }, [totalSlides]);

  const nextSlide = () => {
    // Tombol next akan melingkar kembali ke awal setelah slide terakhir
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    // Tombol prev akan melingkar kembali ke akhir setelah slide pertama
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
      // Swiped left (maju ke slide berikutnya)
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    } else if (touchEndX > touchStartX + threshold) {
      // Swiped right (mundur ke slide sebelumnya)
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }

    setTouchStartX(0);
    setTouchEndX(0);
  };

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Fitur Unggulan
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola pengumpulan sampah dengan
            efisien dan transparan
          </p>
        </div>

        <div className="relative">
          {/* Slider Container */}
          <div
            className="overflow-hidden"
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
                    {" "}
                    {/* Padding horizontal untuk spacing antar kartu */}
                    <FeatureCard
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      bgColor={feature.bgColor}
                      iconBg={feature.iconBg}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 z-10 hidden sm:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 z-10 hidden sm:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-12 space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-gray-800" : "bg-gray-300"
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
