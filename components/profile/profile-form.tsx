"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ProfileFormProps {
  initialFullName: string;
  email: string;
  onNameUpdate?: (newName: string) => void;
}

export default function ProfileForm({
  initialFullName,
  email,
  onNameUpdate,
}: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!fullName.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;

      setMessage("Profil berhasil diperbarui");

      // Callback untuk update parent component
      if (onNameUpdate) {
        onNameUpdate(fullName);
      }

      // Refresh halaman untuk memastikan semua data ter-update
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan saat memperbarui profil");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdateProfile}>
      <CardContent className="space-y-4">
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled type="email" />
          <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button type="submit" disabled={updating}>
          {updating ? "Memperbarui..." : "Simpan Perubahan"}
        </Button>
      </CardFooter>
    </form>
  );
}
