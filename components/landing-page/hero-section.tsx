import Link from "next/link";
import React from "react";
import Image from "next/image";

const HeroSection: React.FC = () => {
  return (
    <section id="beranda" className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Monitor Kebersihan dengan
              <span className="text-green-500 block">Kecerdasan Buatan</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Platform revolusioner untuk memantau, menganalisis, dan melaporkan
              kondisi kebersihan lingkungan menggunakan teknologi AI terdepan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="/map"
                className="block bg-green-500 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full text-base sm:text-lg font-semibold hover:bg-green-700 text-center"
              >
                Mulai Sekarang
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-2 transform rotate-3">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                {/* Background Image */}
                <Image
                  src="/map-background.png"
                  alt="Map Background"
                  fill
                  className="object-cover filter brightness-110 contrast-105"
                  priority
                />

                {/* Overlay untuk readability */}
                <div className="absolute inset-0 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
