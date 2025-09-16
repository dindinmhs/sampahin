"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, MapPin } from "lucide-react";

export default function Page() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nama,
          },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
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
      <header className="relative z-10 flex items-center justify-between p-5">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl text-white font-medium">Sampahin</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-emerald-600 border-white bg-white hover:bg-gray-50"
          >
            Butuh Bantuan
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center min-h-[calc(100vh-88px)] px-4 sm:px-6">
        <div className="flex-1 max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-16">
          {/* Left Side - Hero Text & Stats - Hidden on Mobile */}
          <div className="hidden lg:block flex-1 text-white text-left">
            <h1 className="text-6xl mb-8 leading-tight">
              BERGABUNG
              <br />
              DENGAN KAMI!
            </h1>

            {/* Statistics */}
            <div className="flex items-end gap-12 mb-8">
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl">10K</span>
                  <span className="text-3xl mb-2">+</span>
                </div>
                <p className="text-white/80 text-sm leading-tight max-w-[120px]">
                  Pengguna aktif
                  <br />
                  yang telah bergabung
                  <br />
                  dalam komunitas
                </p>
              </div>

              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl">500</span>
                  <span className="text-3xl mb-2">+</span>
                </div>
                <p className="text-white/80 text-sm leading-tight max-w-[120px]">
                  Kota dan daerah
                  <br />
                  yang telah terjangkau
                  <br />
                  layanan Sampahin
                </p>
              </div>

              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-8xl">1M</span>
                  <span className="text-3xl mb-2">+</span>
                </div>
                <p className="text-white/80 text-sm leading-tight max-w-[120px]">
                  Kilogram sampah
                  <br />
                  yang telah berhasil
                  <br />
                  dikelola dengan baik
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>
                Mari mulai perjalanan menuju lingkungan yang lebih baik
              </span>
            </div>
          </div>

          {/* Register Form - Centered on Mobile */}
          <div className="w-full max-w-sm sm:max-w-md lg:w-96 mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl text-gray-900 mb-2">
                  Daftar ke Sampahin
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Sudah punya akun?{" "}
                  <Link
                    href="/auth/login"
                    className="text-emerald-600 hover:underline"
                  >
                    Masuk disini
                  </Link>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-6">
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <Input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="pl-9 sm:pl-10 text-sm sm:text-base focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Masukkan password (min. 6 karakter)"
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

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 sm:pl-10 pr-10 text-sm sm:text-base focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Ulangi password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
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
                  {isLoading ? "Mendaftar..." : "Daftar Sekarang"}
                </Button>

                {/* Terms */}
                <p className="text-xs text-center text-gray-500 leading-relaxed">
                  Dengan mendaftar, Anda menyetujui{" "}
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
