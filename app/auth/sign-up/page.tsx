"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function Page() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
            point: 0
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
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Illustration */}
      <div className="hidden md:block md:w-1/2 h-full bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500">
        <Image
          src="https://kuqkcswutjdvdcuvzxqn.supabase.co/storage/v1/object/public/sampahin/assets/Register.png"
          width={800}
          height={800}
          alt="Ilustrasi komunitas di pantai"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right side - Sign Up Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md p-6 space-y-6">
          {/* Logo and Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600">
              Bergabung dengan Kami
            </h1>
            <p className="text-lg text-gray-600 max-w-sm mx-auto">
              Daftar sekarang dan mulai berkontribusi untuk lingkungan yang
              lebih bersih
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                type="text"
                placeholder="Masukkan nama lengkap"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi kata sandi"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
            >
              {isLoading ? "Mendaftar..." : "Daftar Sekarang →"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Sudah punya akun? </span>
              <Link
                href="/auth/login"
                className="text-green-600 hover:underline font-medium"
              >
                Masuk di sini
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
