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

  // State untuk custom alert
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Fungsi untuk show alert
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

  // Fungsi untuk close alert
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

        showAlert(
          "success",
          "Penukaran Berhasil!",
          `Berhasil menukar pulsa ${selectedPulsa.provider} ${
            selectedPulsa.nominal
          }! Poin tersisa: ${userPoints - pointCost}`
        );
      } catch (error) {
        console.error("Error redeeming points:", error);
        showAlert(
          "error",
          "Penukaran Gagal",
          "Terjadi kesalahan saat menukar poin. Silakan coba lagi."
        );
      } finally {
        setLoading(false);
      }
    } else {
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
    <div className="min-h-screen">
      {/* Container dengan max-width untuk desktop */}
      <div className="max-w-4xl mx-auto bg-white">
        {/* Poin Section - Responsive padding dan typography */}
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-yellow-400 flex items-center justify-center">
              <span className="text-xs sm:text-sm text-white font-bold">P</span>
            </div>
            {!loading && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {userPoints.toLocaleString()}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-500 text-sm sm:text-base">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Berakhir pada {expiryDate}</span>
          </div>

          <Link
            href={"/riwayat-poin"}
            className="mt-4 text-gray-600 text-sm sm:text-base hover:text-blue-600 transition-colors"
          >
            Lihat Histori
          </Link>
        </div>

        {/* Pulsa Section - Responsive grid dan spacing */}
        <div className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
            Pulsa
          </h3>

          {/* Responsive grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {pulsaOptions.map((pulsa) => (
              <Card
                key={pulsa.id}
                className="overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200"
                onClick={() => handlePulsaSelect(pulsa)}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Responsive layout: stack on small screens */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Logo container dengan ukuran responsive */}
                    <div className="w-12 h-12 sm:w-10 sm:h-10 relative flex-shrink-0">
                      {pulsa.logo ? (
                        <Image
                          src={pulsa.logo}
                          alt={pulsa.provider}
                          fill
                          className="object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {pulsa.provider.substring(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content area dengan responsive layout */}
                    <div className="flex-1 text-center sm:text-left">
                      <p className="font-medium text-sm sm:text-base mb-2 sm:mb-0">
                        {pulsa.provider}
                        <br />
                        Rp. {pulsa.nominal}
                      </p>
                    </div>

                    {/* Badge dengan responsive positioning */}
                    <div className="flex-shrink-0">
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-600 border-yellow-200 text-xs sm:text-sm px-2 py-1"
                      >
                        {pulsa.pointCost.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Responsive sizing */}
      {showConfirmation && selectedPulsa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">
              Konfirmasi Penukaran
            </h3>
            <p className="mb-6 text-sm sm:text-base">
              Anda akan menukar{" "}
              <span className="font-bold">
                {selectedPulsa.pointCost.toLocaleString()}
              </span>{" "}
              poin untuk pulsa{" "}
              <span className="font-bold">
                {selectedPulsa.provider} {selectedPulsa.nominal}
              </span>
            </p>

            {/* Responsive button layout */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancelRedeem}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                Batal
              </button>
              <button
                onClick={handlePulsaRedeem}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Component */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
}
