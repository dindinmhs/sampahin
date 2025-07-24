"use client";
// sidebar.tsx
import { X } from "lucide-react";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "../common/avatar";
import { LocationCleanerType, LocationType } from "@/types/location";
import ChatSidebar from "../chat-forum/chat-sidebar";
import { getDistanceMeters } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";

interface CleanlinessReport {
  id: number;
  reporter: string;
  score: number;
  grade: string;
  ai_description: string;
  created_at: Timestamp;
  location: string;
  reporter_name: string;
  email: string;
}

interface MapSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationType | null;
  latestReport: CleanlinessReport | null;
  onNavigate: () => void;
  isNavigating: boolean;
  locationCleaners: LocationCleanerType[];
  userLocation: [number, number] | null;
}

export const MapSidebar = ({
  isOpen,
  onClose,
  location,
  latestReport,
  onNavigate,
  isNavigating,
  locationCleaners,
  userLocation,
}: MapSidebarProps) => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const user = useUserStore((state) => state.user);

  if (!isOpen || !location) return null;

  const handleReportClick = () => {
    // Cek apakah user berada dalam radius 100m dari lokasi
    if (!userIsNearby) {
      alert(
        "Anda harus berada dalam radius 100m dari lokasi untuk melaporkan lokasi ini sebagai kotor."
      );
      return;
    }
    router.push(`/grading/${location.id}`);
  };

  const handleNavigateClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleChatClick = () => {
    if (latestReport) {
      setIsChatOpen(true);
    } else {
      alert(
        "Belum ada laporan untuk lokasi ini. Chat komunitas hanya tersedia untuk lokasi yang sudah memiliki laporan kebersihan."
      );
    }
  };

  const handleCloseChatSidebar = () => {
    setIsChatOpen(false);
  };

  const cleaners = locationCleaners.filter(
    (c) => c.location_id === location?.id
  );

  const handleStartCleaning = async () => {
    try {
      const supabase = createClient();
      // Update type location jadi cleaning
      await supabase
        .from("locations")
        .update({ type: "cleaning" })
        .eq("id", location?.id);

      // Tambah ke location_cleaners
      await supabase.from("location_cleaners").insert({
        user_id: user?.id,
        location_id: location?.id,
      });

      // Refresh halaman untuk memperbarui UI
    } catch (error) {
      console.error("Error starting cleaning:", error);
      alert("Terjadi kesalahan saat memulai pembersihan. Silakan coba lagi.");
    } finally {
      const fetchMissions = async () => {
      const supabase = createClient();
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("daily_missions_with_status")
        .select("*")
        .eq(`user_id`, user.id)
        .eq('mission_id', '3c60b7d4-1329-4e50-b6f9-3345e9d2d344')
        .order("point_reward", { ascending: true });
      if (error) {
        console.error("Error fetching missions:", error.message);
      }
      if (data?.length == 0) {
        await supabase
          .from('user_mission_logs')
          .insert([
            { user_id: user.id, mission_id: '3c60b7d4-1329-4e50-b6f9-3345e9d2d344', completed_at : new Date().toISOString(), point_earned:20},
          ])
      }

    };
    fetchMissions()
    window.location.reload();
    }
  };

  const handleCancelCleaning = async () => {
    try {
      const supabase = createClient();
      // Hapus dari location_cleaners
      await supabase
        .from("location_cleaners")
        .delete()
        .eq("user_id", user?.id)
        .eq("location_id", location?.id);

      // Jika tidak ada pembersih, update type location jadi dirty
      const { data: cleaners } = await supabase
        .from("location_cleaners")
        .select("*")
        .eq("location_id", location?.id);

      if (!cleaners || cleaners.length === 0) {
        await supabase
          .from("locations")
          .update({ type: "dirty" })
          .eq("id", location?.id);
      }

      // Refresh halaman untuk memperbarui UI
      window.location.reload();
    } catch (error) {
      console.error("Error canceling cleaning:", error);
      alert(
        "Terjadi kesalahan saat membatalkan pembersihan. Silakan coba lagi."
      );
    }
  };

  const handleReport = async () => {
    // Redirect ke halaman grading untuk lokasi ini
    router.push(`/grading/${location.id}`);
  };

  // Fungsi untuk menentukan apakah lokasi bersih berdasarkan grade
  const isCleanLocation = () => {
    return (
      latestReport && (latestReport.grade === "A" || latestReport.grade === "B")
    );
  };

  const isDirty = location.type === "dirty";
  const isCleaning = location.type === "cleaning";
  const userIsNearby =
    userLocation &&
    location &&
    getDistanceMeters(
      userLocation[0],
      userLocation[1],
      location.lan,
      location.lat
    ) < 100;
  const userIsCleaning = cleaners.some((c) => c.user_id === user?.id);

  return (
    <div className="fixed inset-y-0 left-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-50">
        <h2 className="text-lg font-bold text-green-800">Detail Lokasi</h2>
        <button
          onClick={onClose}
          title="Tutup sidebar"
          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-green-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-full pb-20">
        {/* Image */}
        <div className="mb-6">
          <Image
            width={400}
            height={200}
            src={location.img_url}
            alt={location.name}
            className="w-full h-48 object-cover rounded-xl shadow-md"
          />
        </div>

        {/* Location Info */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              {location.name}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-gray-600 min-w-16">
                  Alamat:
                </span>
                <span className="text-gray-800">{location.address}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-600 min-w-16">
                  Tipe:
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {location.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cleanliness Report */}
        {latestReport ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Laporan Kebersihan Terbaru
            </h4>

            <div className="space-y-3">
              {/* Grade */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Grade:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    latestReport.grade === "A"
                      ? "bg-green-100 text-green-800"
                      : latestReport.grade === "B"
                      ? "bg-yellow-100 text-yellow-800"
                      : latestReport.grade === "C"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {latestReport.grade}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Score:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-800">
                    {latestReport.score}
                  </span>
                  <span className="text-gray-500">/100</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    latestReport.score >= 80
                      ? "bg-green-500"
                      : latestReport.score >= 60
                      ? "bg-yellow-500"
                      : latestReport.score >= 40
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  {...{
                    style: {
                      width: `${Math.min(
                        100,
                        Math.max(0, latestReport.score)
                      )}%`,
                    },
                  }}
                />
              </div>

              {/* AI Description */}
              <div>
                <span className="font-semibold text-gray-600 block mb-2">
                  Deskripsi AI:
                </span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed">
                  {latestReport.ai_description}
                </p>
              </div>

              {/* Reporter - Redesigned */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="text-xs text-blue-600 font-medium">
                      Dilaporkan oleh
                    </p>
                    <div className="flex gap-3 items-center mt-2">
                      <Avatar
                        displayName={latestReport.reporter_name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          {latestReport.reporter_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="text-xs text-gray-500 text-center">
                Laporan terakhir:{" "}
                {new Date(latestReport.created_at).toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-center">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 italic">
              Belum ada laporan kebersihan untuk lokasi ini
            </p>
          </div>
        )}

        {/* Active Cleaners */}
        {cleaners.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">
              Sedang Membersihkan ({cleaners.length})
            </h4>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                {cleaners.slice(0, 5).map((c) => (
                  <Avatar
                    key={c.user_id}
                    displayName={c.cleaner_name || "Anonim"}
                    size="sm"
                    className="-ml-2 border-2 border-white first:ml-0"
                  />
                ))}
                {cleaners.length > 5 && (
                  <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                    +{cleaners.length - 5}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                <p>
                  Lokasi ini sedang dibersihkan oleh {cleaners.length} orang.
                  Anda juga dapat bergabung untuk membersihkan lokasi ini.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="space-y-4">
          {/* Navigation & Report Section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Navigation Button */}
            <button
              onClick={handleNavigateClick}
              disabled={isNavigating}
              className={`${
                isNavigating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M3 10a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isNavigating ? "Navigasi Aktif" : "Navigasi"}</span>
            </button>

            {/* Report Dirty Button - hanya untuk lokasi bersih dan user berada dalam radius 100m */}
            {isCleanLocation() ? (
              <button
                onClick={handleReportClick}
                disabled={!userIsNearby}
                className={`${
                  !userIsNearby
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2`}
                title={
                  userIsNearby
                    ? "Laporkan jika tempat ini kotor"
                    : "Anda harus berada dalam radius 100m untuk melaporkan"
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Lapor Kotor</span>
              </button>
            ) : (
              <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-500 flex items-center justify-center text-center">
                <span>Lokasi sudah dilaporkan kotor</span>
              </div>
            )}
          </div>

          {/* Cleaning Actions Section */}
          {(isDirty || isCleaning) && userIsNearby && !userIsCleaning && (
            <button
              onClick={handleStartCleaning}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Mulai Bersihkan</span>
            </button>
          )}

          {/* User is cleaning - show actions */}
          {isCleaning && userIsCleaning && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReport}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Selesai & Lapor</span>
              </button>
              <button
                onClick={handleCancelCleaning}
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Batal</span>
              </button>
            </div>
          )}

          {/* Chat Community Button */}
          <button
            onClick={handleChatClick}
            disabled={!latestReport}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2 ${
              latestReport
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {latestReport ? "Chat Komunitas" : "Chat Tidak Tersedia"}
            </span>
          </button>

          {/* Status Information - pemberitahuan untuk lokasi kotor */}
          {(isDirty || isCleaning) && !userIsNearby && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-sm text-yellow-700">
                Anda harus berada dalam radius 100m untuk membersihkan lokasi
                ini
              </p>
            </div>
          )}

          {/* Status Information - pemberitahuan untuk lokasi bersih yang tidak bisa dilaporkan */}
          {isCleanLocation() && !userIsNearby && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-sm text-yellow-700">
                Anda harus berada dalam radius 100m untuk melaporkan lokasi ini
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {latestReport && (
        <ChatSidebar
          reportId={latestReport.id.toString()}
          locationName={location.name}
          isOpen={isChatOpen}
          onClose={handleCloseChatSidebar}
        />
      )}
    </div>
  );
};
