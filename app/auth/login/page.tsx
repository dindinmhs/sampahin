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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/map");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-6 max-h-full">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 17a7 7 0 1114 0H5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600">
              Selamat Datang
            </h1>
            <p className="text-gray-600 text-lg">
              Masuk untuk melanjutkan pengelolaan sampah berkelanjutan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="Masukkan Alamat Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Masukkan Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md"
            >
              {isLoading ? "Masuk..." : "Masuk →"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Belum punya akun? </span>
              <Link
                href="/auth/sign-up"
                className="text-green-600 hover:underline font-medium"
              >
                Daftar Sekarang
              </Link>
            </div>
            <div className="text-center text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-gray-500 hover:underline"
              >
                Lupa kata sandi?
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden md:block md:w-1/2 h-full">
        <Image
          src="https://kuqkcswutjdvdcuvzxqn.supabase.co/storage/v1/object/public/sampahin/assets/Login.png"
          alt="Ilustrasi komunitas"
          width={800}
          height={800}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
