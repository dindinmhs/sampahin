"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { CustomAlert } from "./custom-alert";

interface PulsaOption {
  id: number;
  provider: string;
  nominal: number;
  pointCost: number;
  logo: string;
}

interface TukarPoinClientProps {
  expiryDate: string;
  pulsaOptions: PulsaOption[];
}

interface AlertState {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
}

export function TukarPoinClient({
  expiryDate,
  pulsaOptions,
}: TukarPoinClientProps) {
  const [userPoints, setUserPoints] = useState(0);
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const [selectedPulsa, setSelectedPulsa] = useState<PulsaOption | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // TAMBAHKAN: State untuk custom alert
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // TAMBAHKAN: Fungsi untuk show alert
  const showAlert = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  // TAMBAHKAN: Fungsi untuk close alert
  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePulsaSelect = (pulsa: PulsaOption) => {
    setSelectedPulsa(pulsa);
    setShowConfirmation(true);
  };

  const handlePulsaRedeem = async () => {
    if (!selectedPulsa) return;

    const pointCost = selectedPulsa.pointCost;

    if (userPoints >= pointCost) {
      setLoading(true);
      try {
        // 1. Kurangi poin pengguna
        const { error: pointError } = await supabase
          .from("point_transactions")
          .insert([
            {
              user_id: user?.id,
              amount: pointCost,
              type: "out",
            },
          ]);

        if (pointError) throw pointError;

        // 2. Refresh poin pengguna
        await fetchPoin();

        // 3. Tutup dialog konfirmasi
        setShowConfirmation(false);
        setSelectedPulsa(null);

        // UBAH: Ganti alert() dengan custom alert
        showAlert(
          "success",
          "Penukaran Berhasil!",
          `Berhasil menukar pulsa ${selectedPulsa.provider} ${
            selectedPulsa.nominal
          }! Poin tersisa: ${userPoints - pointCost}`
        );
      } catch (error) {
        console.error("Error redeeming points:", error);
        // UBAH: Ganti alert() dengan custom alert
        showAlert(
          "error",
          "Penukaran Gagal",
          "Terjadi kesalahan saat menukar poin. Silakan coba lagi."
        );
      } finally {
        setLoading(false);
      }
    } else {
      // UBAH: Ganti alert() dengan custom alert
      showAlert(
        "error",
        "Poin Tidak Cukup",
        "Poin Anda tidak mencukupi untuk penukaran ini."
      );
      setShowConfirmation(false);
    }
  };

  const handleCancelRedeem = () => {
    setShowConfirmation(false);
    setSelectedPulsa(null);
  };

  const fetchPoin = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("total_poin_per_user")
      .select("total_poin")
      .eq("user_id", user?.id)
      .single();

    if (!error && data) {
      setUserPoints(data.total_poin);
    }
    setLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchPoin();
  }, [fetchPoin]);

  return (
    <>
      {/* Poin Section */}
      <div className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-xs text-white font-bold">P</span>
          </div>
          {!loading && <h2 className="text-2xl font-bold">{userPoints}</h2>}
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Clock className="h-4 w-4" />
          <span>Berakhir pada {expiryDate}</span>
        </div>

        <Link href={"/riwayat-poin"} className="mt-4 text-gray-600">
          Lihat Histori
        </Link>
      </div>

      {/* Pulsa Section */}
      <div className="px-6 pb-6">
        <h3 className="text-lg font-semibold mb-4">Pulsa</h3>
        <div className="grid grid-cols-2 gap-4">
          {pulsaOptions.map((pulsa) => (
            <Card
              key={pulsa.id}
              className="overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handlePulsaSelect(pulsa)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative">
                    {pulsa.logo ? (
                      <Image
                        src={pulsa.logo}
                        alt={pulsa.provider}
                        width={40}
                        height={40}
                        className="object-contain rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {pulsa.provider}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {pulsa.provider} {pulsa.nominal}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-600 border-yellow-200"
                >
                  {pulsa.pointCost}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedPulsa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Konfirmasi Penukaran</h3>
            <p className="mb-4">
              Anda akan menukar{" "}
              <span className="font-bold">{selectedPulsa.pointCost}</span> poin
              untuk pulsa{" "}
              <span className="font-bold">
                {selectedPulsa.provider} {selectedPulsa.nominal}
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelRedeem}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handlePulsaRedeem}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAMBAHKAN: Custom Alert Component */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </>
  );
}
