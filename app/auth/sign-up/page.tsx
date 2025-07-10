"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
<<<<<<< HEAD
import Image from 'next/image'
=======
import Image from "next/image";
>>>>>>> 99290a3acdca807dcec0c9bbd54974c954127591

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
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
<<<<<<< HEAD
      <div className="flex-1 bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500">
        <Image
          src="https://kuqkcswutjdvdcuvzxqn.supabase.co/storage/v1/object/sign/sampahin/assets/Register.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81YjBhZDgyMi1iYjIwLTQ1ZmUtYTM5Ny0zMzI3MDc4MDgyZWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzYW1wYWhpbi9hc3NldHMvUmVnaXN0ZXIucG5nIiwiaWF0IjoxNzUxOTUwNDYwLCJleHAiOjMxNzA4MDQxNDQ2MH0.XSm4Hs-2j9gOKQhif-7i9OEMK7sMOAY0Vx5IF3Zc9x4"
          alt="Ilustrasi komunitas di pantai yang sedang membersihkan sampah dengan tempat sampah hijau untuk daur ulang dan tempat sampah merah, menunjukkan aktivitas pembersihan lingkungan berkelanjutan di tepi pantai dengan pohon kelapa"
          className="w-full h-auto rounded-lg shadow-lg"
          width={600}
            height={400}
        />
=======
      <div className="flex-1 bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500 flex items-center justify-center p-8">
        <div className="max-w-2xl">
          <Image
            src="/api/placeholder/800/600"
            width={500}
            height={500}
            alt="Ilustrasi komunitas di pantai yang sedang membersihkan sampah dengan tempat sampah hijau untuk daur ulang dan tempat sampah merah, menunjukkan aktivitas pembersihan lingkungan berkelanjutan di tepi pantai dengan pohon kelapa"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
>>>>>>> 99290a3acdca807dcec0c9bbd54974c954127591
      </div>

      {/* Right side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Bergabung dengan Kami</h1>
            <p className="text-gray-600 text-center max-w-sm mx-auto">
              Daftar sekarang dan mulai berkontribusi untuk lingkungan yang lebih bersih
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="nama" className="text-sm font-medium text-gray-700">
                  Nama
                </Label>
                <Input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Kata Sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Konfirmasi Kata Sandi
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi kata sandi"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Mendaftar..." : "Daftar Sekarang →"}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">Sudah punya akun? </span>
              <Link
                href="/auth/login"
                className="text-green-600 hover:text-green-700 font-medium"
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
