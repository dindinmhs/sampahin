"use client";

import { X } from "lucide-react";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Avatar from "../common/avatar";
import { LocationType } from "@/types/location";

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
  onOpenChat: () => void;
}

export const MapSidebar = ({
  isOpen,
  onClose,
  location,
  latestReport,
  onNavigate,
  isNavigating,
  onOpenChat,
}: MapSidebarProps) => {
  const router = useRouter();

  if (!isOpen || !location) return null;

  const handleReportClick = () => {
    router.push(`/grading/${location.id}`);
  };

  const handleNavigateClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleChatClick = () => {
    if (onOpenChat) {
      onOpenChat();
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-50">
        <h2 className="text-lg font-bold text-green-800">Detail Lokasi</h2>
        <button
          onClick={onClose}
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
                  className={`h-2 rounded-full ${
                    latestReport.score >= 80
                      ? "bg-green-500"
                      : latestReport.score >= 60
                      ? "bg-yellow-500"
                      : latestReport.score >= 40
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${latestReport.score}%` }}
                ></div>
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
                        <p className="text-xs font-semibold text-blue-800">
                          {latestReport.email}
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleReportClick}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            <span>Lapor</span>
          </button>
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
        </div>

        {/* Chat Button */}
        <div className="mb-6">
          <button
            onClick={handleChatClick}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Buka Chat Komunitas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
