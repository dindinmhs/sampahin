import React from "react";
import Link from "next/link";
import { Rocket, ArrowRight, Sparkles } from "lucide-react";

const CTASection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-cyan-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.3),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.3),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.3),transparent_50%)]"></div>

      {/* Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-4 h-4 bg-white rounded-full opacity-60 animate-ping"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-emerald-400 rounded-full opacity-40 animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-8 h-8 bg-teal-400 rounded-full opacity-50 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-12 h-12 border-2 border-white/30 rotate-45 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>

        {/* Floating Shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white">Ready to Transform?</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-7xl font-black text-white leading-tight">
              Waktunya
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Revolusi Digital
              </span>
            </h2>

            <p className="text-xl lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Bergabunglah dengan{" "}
              <span className="font-black text-white">1000+ kota</span> yang
              sudah mentransformasi sistem monitoring sampah mereka dengan{" "}
              <span className="font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Sampahin AI
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Link
              href="/map"
              className="text-lg inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white border-0 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 font-bold px-8 py-4 rounded-full group"
            >
              <Rocket className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              Mulai Transformasi
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="text-center">
              <div className="text-white/80 text-sm">
                🚀 Setup dalam 5 menit
              </div>
              <div className="text-white/60 text-xs">
                No credit card required
              </div>
            </div>
          </div>

          {/* Social Proof */}
          {/* <div className="pt-12 space-y-4">
            <div className="text-white/60 text-sm">Dipercaya oleh</div>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-white/40">
              <div className="font-bold text-lg">Jakarta Smart City</div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <div className="font-bold text-lg">Surabaya Digital</div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <div className="font-bold text-lg">Bandung Cerdas</div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
