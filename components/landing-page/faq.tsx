"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  isVisible: boolean;
}

const FAQItem: React.FC<FAQItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
  index,
  isVisible,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`border border-emerald-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-emerald-50/50 transition-colors duration-300 group"
      >
        <h3 className="text-lg font-bold text-slate-900 pr-4 group-hover:text-emerald-700 transition-colors">
          {question}
        </h3>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="w-4 h-4 text-white" />
        </div>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : "0px",
        }}
      >
        <div className="px-6 pb-6 pt-0">
          <div className="border-t border-emerald-100 pt-4">
            <p className="text-slate-600 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
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

  const faqs = [
    {
      question: "Apa itu Sampahin dan bagaimana cara kerjanya?",
      answer:
        "Sampahin adalah platform monitoring sampah berbasis AI yang memungkinkan Anda memantau, menganalisis, dan melaporkan kondisi kebersihan lingkungan secara real-time. Cukup ambil foto lokasi dengan smartphone, AI kami akan otomatis menganalisis dan memberikan skor kebersihan, lalu data tersinkronisasi ke peta interaktif untuk monitoring yang lebih efektif.",
    },
    {
      question: "Apakah Sampahin gratis untuk digunakan?",
      answer:
        "Ya, Sampahin menyediakan akses gratis dengan fitur dasar seperti upload foto, analisis AI, dan akses ke peta interaktif. Untuk fitur premium seperti laporan detail, analitik mendalam, dan integrasi API, tersedia paket berlangganan dengan harga terjangkau.",
    },
    {
      question: "Seberapa akurat teknologi AI dalam mendeteksi kondisi sampah?",
      answer:
        "Teknologi AI Sampahin memiliki tingkat akurasi hingga 94% dalam mendeteksi dan menganalisis kondisi kebersihan. Sistem kami telah dilatih dengan jutaan data gambar dari berbagai kondisi lingkungan dan terus berkembang untuk memberikan hasil yang semakin akurat.",
    },
    {
      question: "Bisakah Sampahin digunakan untuk monitoring area yang luas?",
      answer:
        "Tentu saja! Sampahin dirancang untuk monitoring area dari skala kecil hingga kota besar. Platform kami sudah digunakan oleh 1000+ kota dan mampu memproses 50M+ data points. Sistem kami mendukung multi-user dan dapat menangani monitoring area yang sangat luas secara efisien.",
    },
    {
      question: "Apakah data yang diupload aman dan terlindungi?",
      answer:
        "Keamanan data adalah prioritas utama kami. Semua data dienkripsi end-to-end, disimpan di server yang aman dengan standar keamanan tinggi, dan hanya dapat diakses oleh pengguna yang berwenang. Kami juga mematuhi standar GDPR untuk perlindungan data pribadi.",
    },
    {
      question:
        "Bagaimana cara mengintegrasikan Sampahin dengan sistem yang sudah ada?",
      answer:
        "Sampahin menyediakan API yang komprehensif dan dokumentasi lengkap untuk integrasi dengan sistem existing. Tim teknis kami juga siap membantu proses integrasi dengan sistem pemerintah, aplikasi mobile, atau platform manajemen lainnya sesuai kebutuhan organisasi Anda.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50"
      ref={sectionRef}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div
          className={`absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-emerald-300/20 to-teal-300/20 rounded-full blur-3xl transition-all duration-1000 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        ></div>
        <div
          className={`absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 rounded-full blur-3xl transition-all duration-1200 delay-300 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        ></div>

        {/* Floating Elements */}
        <div
          className={`absolute top-40 left-1/4 w-6 h-6 bg-emerald-400 rounded-full animate-bounce transition-all duration-800 delay-500 ${
            isVisible ? "opacity-60 scale-100" : "opacity-0 scale-0"
          }`}
        ></div>
        <div
          className={`absolute bottom-1/3 right-1/4 w-8 h-8 border-2 border-teal-400 rotate-45 animate-pulse transition-all duration-800 delay-700 ${
            isVisible ? "opacity-40 scale-100" : "opacity-0 scale-0"
          }`}
        ></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <div
            className={`inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-cyan-100 backdrop-blur-sm rounded-full px-6 py-2 border border-emerald-200/50 transition-all duration-800 ${
              isVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-medium font-bold text-emerald-700">
              Frequently Asked Questions
            </span>
          </div>

          <h2
            className={`text-4xl lg:text-5xl font-black text-slate-900 leading-tight transition-all duration-1000 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Pertanyaan
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {" "}
              Umum
            </span>
          </h2>

          <p
            className={`text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Temukan jawaban untuk pertanyaan yang sering diajukan tentang
            platform monitoring sampah Sampahin
          </p>
        </div>

        {/* FAQ Items */}
        <div
          className={`space-y-4 transition-all duration-1000 delay-600 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* CTA Footer */}
        <div
          className={`text-center mt-16 transition-all duration-1000 delay-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-8 border border-emerald-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Masih ada pertanyaan?
            </h3>
            <p className="text-slate-600 mb-4">
              Tim support kami siap membantu Anda 24/7
            </p>
            <button className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 font-bold px-6 py-3">
              Hubungi Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
