"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Masuk...");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setLoadingMessage("Masuk...");

    // Add timeout protection
    const loginTimeout = setTimeout(() => {
      setError("Login timeout. Silakan coba lagi.");
      setIsLoading(false);
      setLoadingMessage("Masuk...");
    }, 10000); // 10 second timeout

    try {
      console.log("Attempting login for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      console.log("Login successful, session:", data.session);
      setLoadingMessage("Memuat...");

      // Verify session is established
      if (data.session) {
        console.log("Session verified, redirecting...");
        setLoadingMessage("Mengalihkan...");

        // Get current session to ensure it's still valid
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Current session:", sessionData.session);

        if (sessionData.session) {
          // Clear timeout since we're successful
          clearTimeout(loginTimeout);

          // Force redirect using multiple methods to ensure it works
          router.replace("/map");

          // Fallback redirect if router.replace doesn't work
          setTimeout(() => {
            console.log("Fallback redirect triggered");
            window.location.href = "/map";
          }, 100);
        } else {
          throw new Error("Session tidak dapat diverifikasi");
        }
      } else {
        throw new Error("Session tidak dapat dibuat");
      }
    } catch (error: unknown) {
      console.error("Login process error:", error);
      clearTimeout(loginTimeout);
      setError(
        error instanceof Error ? error.message : "Terjadi kesalahan saat masuk"
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("Masuk...");
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/bg-login.png"
          alt="Waste management and recycling - Environmental sustainability"
          fill
          className="w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/60"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="Sampahin Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl sm:text-3xl text-white font-medium">
              Sampahin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-emerald-600 border-white bg-white hover:bg-gray-50 text-sm sm:text-base px-3 sm:px-4"
          >
            <span className="hidden sm:inline">Butuh Bantuan</span>
            <span className="sm:hidden">Bantuan</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center min-h-[calc(100vh-88px)] px-4 sm:px-6">
        <div className="flex-1 max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-16">
          {/* Left Side - Hero Text & Stats - Hidden on Mobile */}
          <div className="hidden lg:block flex-1 text-white text-left">
            <h1 className="text-6xl mb-8 leading-tight">
              KELOLA SAMPAH
              <br />
              BERSAMA KAMI!
            </h1>

            {/* Statistics */}
            <div className="flex items-end gap-12 mb-8">
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl">95</span>
                  <span className="text-3xl mb-2">%</span>
                </div>
                <p className="text-white/80 text-sm leading-tight max-w-[120px]">
                  Tingkat Akurasi
                  <br />
                  AI Scanner pada
                  <br />
                  identifikasi jenis sampah
                </p>
              </div>

              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl">24</span>
                  <span className="text-3xl mb-2">/7</span>
                </div>
                <p className="text-white/80 text-sm leading-tight max-w-[120px]">
                  Layanan monitoring
                  <br />
                  dan tracking
                  <br />
                  pengelolaan sampah
                </p>
              </div>

              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl">50</span>
                  <span className="text-3xl mb-2">+</span>
                </div>
                <p className="text-white/80 text-sm leading-tight max-w-[120px]">
                  Kategori sampah
                  <br />
                  yang dapat teridentifikasi
                  <br />
                  dengan rekomendasi aksi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>
                Mari mulai perjalanan menuju lingkungan yang lebih baik
              </span>
            </div>
          </div>

          {/* Login Form - Centered on Mobile */}
          <div className="w-full max-w-sm sm:max-w-md lg:w-96 mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Masuk ke Sampahin
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Belum punya akun?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="text-emerald-600 hover:underline"
                  >
                    Daftar disini
                  </Link>
                </p>
              </div>

              {/* Login with Email */}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 sm:pl-10 text-sm sm:text-base focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Masukkan alamat email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 sm:pl-10 pr-10 text-sm sm:text-base focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Masukkan password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 sm:py-3 text-sm sm:text-base rounded-lg"
                >
                  {isLoading ? loadingMessage : "Masuk"}
                </Button>

                {/* Forgot Password */}
                <div className="text-center">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs sm:text-sm text-gray-500 hover:text-emerald-600 transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>

                {/* Terms */}
                <p className="text-xs text-center text-gray-500 leading-relaxed">
                  Dengan masuk, Anda menyetujui{" "}
                  <a href="#" className="text-emerald-500 hover:underline">
                    Syarat & Ketentuan
                  </a>{" "}
                  kami tentang{" "}
                  <a href="#" className="text-emerald-500 hover:underline">
                    Keamanan
                  </a>{" "}
                  dan{" "}
                  <a href="#" className="text-emerald-500 hover:underline">
                    Kebijakan Privasi
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
