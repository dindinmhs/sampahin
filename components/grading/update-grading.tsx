"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, RotateCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { LocationType } from "@/types/location";
import { mimeToExt } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";
import {
  validateAndCompressImage,
  fileToBase64,
  formatFileSize,
} from "@/lib/utils/image-compression";

const CoordinatePicker = dynamic(() => import("../common/coordinat-picker"), {
  ssr: false,
});

interface AnalysisResultProps {
  skor_kebersihan: number | null;
  grade: string | null;
  deskripsi: string | null;
  imageSimilarity?: number | null;
  canShare?: boolean;
  reason?:
    | "grade_insufficient"
    | "similarity_too_low"
    | "valid"
    | "no_previous_report"
    | "no_embedding_first_report";
  previousReport?: {
    grade: string;
    score: number;
    report_id: string;
  };
}

export const UpdateGradingForm = () => {
  const supabase = createClient();
  const params = useParams();
  const placeId = params.place_id;
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationType[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  ); // Default ke kamera belakang
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMessage, setCompressionMessage] = useState<string | null>(
    null
  );
  const [fileError, setFileError] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResultProps | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUserStore((state) => state.user);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setAnalysisResult(null);
    setFileError(null);
    setCompressionMessage(null);
    setIsCompressing(true);

    try {
      // Validate and compress if needed
      const result = await validateAndCompressImage(file);

      if (!result.valid) {
        setFileError(result.message || "File tidak valid");
        setIsCompressing(false);
        return;
      }

      // Use compressed file if available, otherwise use original
      const finalFile = result.compressed || file;
      setSelectedImage(finalFile);

      // Set compression message if file was compressed
      if (result.compressed) {
        setCompressionMessage(
          result.message ||
            `Gambar dikompres ke ${formatFileSize(finalFile.size)}`
        );
      }

      // Create preview URL
      const url = URL.createObjectURL(finalFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error processing file:", error);
      setFileError("Gagal memproses gambar. Silakan coba lagi.");
    } finally {
      setIsCompressing(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCapturing(true); // Set capturing state immediately to show UI feedback

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      // Try environment (back) camera first for better user experience
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Start with back camera by default
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setFacingMode("environment"); // Update facing mode state
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error("Error playing video:", err);
              setCameraError("Gagal memulai video kamera. Silakan coba lagi.");
              setIsCapturing(false); // Reset capturing state on error
            });
          };
        }
        return; // Successfully started back camera
      } catch (backCameraError) {
        console.error("Back camera access failed:", backCameraError);
        setCameraError("Mencoba kamera depan sebagai alternatif...");
        setIsCapturing(false); // Reset capturing state temporarily
      }

      // Try user camera (front camera) as fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user", // Try front camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setFacingMode("user"); // Update facing mode state
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error("Error playing video:", err);
              setCameraError("Gagal memulai video kamera. Silakan coba lagi.");
              setIsCapturing(false); // Reset capturing state on error
            });
          };
        }
        setCameraError(null);
        setIsCapturing(true);
        return; // Successfully started front camera
      } catch (frontCameraError) {
        console.error("Front camera access failed:", frontCameraError);
        setCameraError("Mencoba akses kamera generik...");
        setIsCapturing(false); // Reset capturing state temporarily
      }

      // Try generic camera access as last resort
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error("Error playing video:", err);
              setCameraError("Gagal memulai video kamera. Silakan coba lagi.");
              setIsCapturing(false); // Reset capturing state on error
            });
          };
        }
        setCameraError(null);
        setIsCapturing(true);
        return; // Successfully started generic camera
      } catch (genericError) {
        console.error("Generic camera access failed:", genericError);
        throw genericError; // Re-throw to be caught by outer catch block
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Tidak dapat mengakses kamera. ";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage +=
            "Izin kamera ditolak. Silakan izinkan akses kamera di browser.";
        } else if (error.name === "NotFoundError") {
          errorMessage += "Kamera tidak ditemukan pada perangkat ini.";
        } else if (error.name === "NotSupportedError") {
          errorMessage += "Browser tidak mendukung akses kamera.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage += "Resolusi kamera yang diminta tidak didukung.";
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      }

      setCameraError(errorMessage);
      setIsCapturing(false);
    }
  };

  const toggleCamera = async () => {
    // Show loading state or indicator
    setCameraError(null);

    // Stop current camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Toggle camera direction
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    try {
      // Request camera with new facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Set video stream and play
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
            setCameraError("Gagal memutar video kamera. Silakan coba lagi.");
            setIsCapturing(false); // Reset capturing state on error
          });
        };
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      setCameraError("Gagal mengganti kamera. Silakan coba lagi.");

      // Try the opposite camera as fallback
      try {
        const fallbackMode = newFacingMode === "user" ? "environment" : "user";
        setFacingMode(fallbackMode);

        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: fallbackMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error("Error playing fallback video:", err);
              setCameraError("Gagal memutar video kamera. Silakan coba lagi.");
              setIsCapturing(false); // Reset capturing state on error
            });
          };
          setCameraError(
            "Kamera yang dipilih tidak tersedia, menggunakan kamera alternatif."
          );
        }
      } catch (fallbackError) {
        console.error("Error with fallback camera:", fallbackError);
        setCameraError(
          "Tidak dapat mengakses kamera. Silakan periksa izin kamera di browser Anda."
        );
        setIsCapturing(false); // Reset capturing state on complete failure
      }
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const file = new File([blob], "camera-photo.jpg", {
                type: "image/jpeg",
              });

              // Reset states and show processing
              setAnalysisResult(null);
              setFileError(null);
              setCompressionMessage(null);
              setIsCompressing(true);

              try {
                // Validate and compress if needed
                const result = await validateAndCompressImage(file);

                if (!result.valid) {
                  setFileError(result.message || "Gagal memproses foto");
                  setIsCompressing(false);
                  return;
                }

                // Use compressed file if available
                const finalFile = result.compressed || file;
                setSelectedImage(finalFile);

                if (result.compressed) {
                  setCompressionMessage(
                    result.message ||
                      `Foto dikompres ke ${formatFileSize(finalFile.size)}`
                  );
                }

                setPreviewUrl(URL.createObjectURL(finalFile));
                stopCamera();
              } catch (error) {
                console.error("Error processing camera photo:", error);
                setFileError("Gagal memproses foto. Silakan coba lagi.");
              } finally {
                setIsCompressing(false);
              }
            }
          },
          "image/jpeg",
          0.9
        );
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setCameraError(null);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalysis = async () => {
    if (!selectedImage) {
      alert("Silakan pilih gambar terlebih dahulu");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(selectedImage);

      console.log("Starting update grading check for location:", placeId);

      // Call the new API for comprehensive check
      const res = await fetch("/api/update-grading-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          locationId: placeId,
          similarityThreshold: 0.6, // 60% minimum similarity
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      console.log("Update grading check result:", data);

      if (data.grading) {
        // Set analysis result with all the information
        setAnalysisResult({
          skor_kebersihan: data.grading.skor_kebersihan,
          grade: data.grading.grade,
          deskripsi: data.grading.deskripsi,
          imageSimilarity: data.similarity?.image_similarity || null,
          canShare: data.canShare,
          reason: data.reason,
          previousReport: data.similarity
            ? {
                grade: data.similarity.grade,
                score: data.similarity.score,
                report_id: data.similarity.report_id,
              }
            : undefined,
        });
      } else {
        setAnalysisResult({
          skor_kebersihan: null,
          grade: null,
          deskripsi: "Gagal menganalisis gambar.",
          canShare: false,
          reason: "grade_insufficient",
        });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisResult({
        skor_kebersihan: null,
        grade: null,
        deskripsi: "Terjadi kesalahan saat analisis. Silakan coba lagi.",
        canShare: false,
        reason: "grade_insufficient",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  useEffect(() => {
    const getLocation = async () => {
      const { data: locations, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", placeId);

      if (error) console.error(error);

      setLocation(locations);
    };

    getLocation();
  }, [placeId, supabase]);

  const updateReport = async () => {
    if (selectedImage && location) {
      setLoading(true);

      const authRes = await supabase.auth.getUser();
      const fileExt =
        mimeToExt[selectedImage.type as keyof typeof mimeToExt] || "";
      const safeName = location[0].name.replace(/\s+/g, "-").toLowerCase();
      const filePath = `locations/${safeName}_${Date.now()}${fileExt}`;

      try {
        // 1. Ambil data lokasi lama dulu untuk dapat URL lama
        const current = await supabase
          .from("locations")
          .select("img_url")
          .eq("id", placeId)
          .single();

        // 2. Hapus gambar lama jika ada
        if (current.data?.img_url) {
          const fullPath = current.data.img_url.split("/object/public/")[1];
          const pathInBucket = fullPath.split("/").slice(1).join("/");

          await supabase.storage.from("sampahin").remove([pathInBucket]);
        }

        // 3. Upload gambar baru
        const storageRes = await supabase.storage
          .from("sampahin")
          .upload(filePath, selectedImage);
        if (storageRes.error) throw storageRes.error;

        // 4. Ambil URL publik
        const {
          data: { publicUrl },
        } = await supabase.storage.from("sampahin").getPublicUrl(filePath);

        // 5. Tentukan tipe lokasi berdasarkan grade
        const locationType =
          analysisResult?.grade === "A" || analysisResult?.grade === "B"
            ? "clean"
            : "dirty";

        // 6. Update lokasi dengan URL gambar baru dan tipe berdasarkan grade
        const locationRes = await supabase
          .from("locations")
          .update([
            {
              img_url: publicUrl,
              type: locationType, // Update tipe lokasi berdasarkan grade
            },
          ])
          .eq("id", placeId)
          .select("id");

        if (!locationRes.data) throw locationRes.error;

        // 7. Tambahkan laporan kebersihan
        const cleanlinessRes = await supabase
          .from("cleanliness_reports")
          .insert([
            {
              reporter: authRes.data.user?.id,
              location: placeId,
              score: analysisResult?.skor_kebersihan,
              grade: analysisResult?.grade,
              ai_description: analysisResult?.deskripsi,
            },
          ])
          .select();

        if (cleanlinessRes.error) throw cleanlinessRes.error;

        // 8. Hapus semua pembersih dari location_cleaners karena lokasi sudah selesai dibersihkan
        await supabase
          .from("location_cleaners")
          .delete()
          .eq("location_id", placeId);

        // Redirect ke halaman peta setelah berhasil
        window.location.href = "/map";
      } catch (error) {
        console.error("Error updating report:", error);
        alert("Terjadi kesalahan saat memperbarui laporan. Silakan coba lagi.");
      } finally {
        setLoading(false);
        const fetchMissions = async () => {
          const supabase = createClient();
          if (!user?.id) return;
          const { data, error } = await supabase
            .from("daily_missions_with_status")
            .select("*")
            .eq(`user_id`, user.id)
            .eq("mission_id", "00ef9788-16e5-4658-9522-1fcb8ae42820")
            .order("point_reward", { ascending: true });
          if (error) {
            console.error("Error fetching missions:", error.message);
          }
          if (data?.length == 0) {
            await supabase.from("user_mission_logs").insert([
              {
                user_id: user.id,
                mission_id: "00ef9788-16e5-4658-9522-1fcb8ae42820",
                completed_at: new Date().toISOString(),
                point_earned: 20,
              },
            ]);
          }
        };
        fetchMissions();
      }
    }
  };

  if (location)
    return (
      <div className="bg-gray-50 p-4 min-h-screen">
        <div className="max-w-2xl mx-auto py-10">
          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow-sm px-6 py-2">
            {/* Foto Label */}
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-5">
                Laporkan Kondisi Terkini
              </h2>
              <CoordinatePicker
                value={[location[0].lan, location[0].lat]}
                readOnly={true}
              />
              <p className="my-2 font-medium">{location[0].name}</p>
              <p className="text-sm text-gray-500">{location[0].address}</p>
              <h2 className="text-sm font-medium text-gray-700 mb-3 mt-6">
                Foto Lokasi untuk di grading
              </h2>

              {/* Image Upload Section */}
              {!isCapturing && !previewUrl && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50">
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-800 mb-2">
                          Upload Foto Lokasi
                        </p>
                        <p className="text-sm text-slate-600">
                          Pilih foto kondisi terkini lokasi untuk dinilai
                          kebersihannya
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-teal-500 hover:bg-teal-600 text-white"
                          disabled={isCapturing}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Pilih dari Galeri
                        </Button>
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          className="border-teal-500 text-teal-500 hover:bg-teal-50"
                          disabled={isCapturing}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Buka Kamera
                        </Button>
                      </div>

                      {/* File Processing Feedback */}
                      {isCompressing && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <p className="text-sm text-blue-800">
                              Memproses gambar...
                            </p>
                          </div>
                        </div>
                      )}

                      {compressionMessage && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800 text-center">
                            ✅ {compressionMessage}
                          </p>
                        </div>
                      )}

                      {fileError && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-800 text-center">
                            ❌ {fileError}
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <p className="text-xs text-slate-500 text-center">
                          Format: JPEG, PNG, WebP • Auto-compress diatas 3MB •
                          Maksimal upload: 50MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Camera Section */}
            {isCapturing && (
              <div className="space-y-4 mb-4">
                <div className="relative">
                  {cameraError ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                      <p className="text-red-800 mb-4">{cameraError}</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={startCamera}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Coba Lagi
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative bg-black rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-96 object-cover"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          onClick={toggleCamera}
                          size="sm"
                          variant="secondary"
                          className="bg-white/80 hover:bg-white"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {!cameraError && (
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={capturePhoto}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Ambil Foto
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Image Preview Section */}
            {previewUrl && !isCapturing && (
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="w-full h-auto max-h-96 object-contain rounded-xl border border-slate-200"
                  />
                  <Button
                    onClick={removeImage}
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    onClick={handleAnalysis}
                    disabled={isAnalyzing}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 text-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Menganalisis...
                      </>
                    ) : (
                      "Analisis Kebersihan"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <div className="mb-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📊 Hasil Penilaian
                  </h2>

                  <div className="space-y-6">
                    {/* Only show score and grade if it's a valid grading result */}
                    {analysisResult.skor_kebersihan !== null &&
                      analysisResult.grade !== null && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 text-center">
                            <h4 className="font-semibold text-teal-800 mb-2">
                              Skor Kebersihan
                            </h4>
                            <span
                              className={`font-bold text-4xl ${
                                analysisResult.grade === "A"
                                  ? "text-green-500"
                                  : analysisResult.grade === "B"
                                  ? "text-blue-500"
                                  : analysisResult.grade === "C"
                                  ? "text-yellow-500"
                                  : analysisResult.grade === "D"
                                  ? "text-orange-600"
                                  : analysisResult.grade === "E"
                                  ? "text-red-500"
                                  : "text-gray-500"
                              }`}
                            >
                              {analysisResult.skor_kebersihan}
                            </span>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 text-center">
                            <h4 className="font-semibold text-purple-800 mb-2">
                              Grade
                            </h4>
                            <span
                              className={`font-bold text-4xl ${
                                analysisResult.grade === "A"
                                  ? "text-green-500"
                                  : analysisResult.grade === "B"
                                  ? "text-blue-500"
                                  : analysisResult.grade === "C"
                                  ? "text-yellow-500"
                                  : analysisResult.grade === "D"
                                  ? "text-orange-600"
                                  : analysisResult.grade === "E"
                                  ? "text-red-500"
                                  : "text-gray-500"
                              }`}
                            >
                              {analysisResult.grade}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Show similarity info if available */}
                    {analysisResult.imageSimilarity !== undefined &&
                      analysisResult.imageSimilarity !== null && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-indigo-800">
                              Kemiripan dengan report sebelumnya:
                            </span>
                            <span
                              className={`font-bold text-lg ${
                                analysisResult.imageSimilarity >= 0.6
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {(analysisResult.imageSimilarity * 100).toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                          {analysisResult.previousReport && (
                            <div className="text-sm text-indigo-600">
                              Dibandingkan dengan report grade{" "}
                              {analysisResult.previousReport.grade}
                              (skor: {analysisResult.previousReport.score})
                            </div>
                          )}
                        </div>
                      )}

                    {/* Show sharing eligibility */}
                    {analysisResult.canShare !== undefined && (
                      <div>
                        {!analysisResult.canShare && (
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                            <p className="text-orange-700 text-sm font-medium">
                              ⚠️{" "}
                              {analysisResult.reason === "similarity_too_low"
                                ? "Gambar tidak cukup mirip dengan report sebelumnya di lokasi ini (minimal 60% similarity)."
                                : "Tidak memenuhi syarat untuk dibagikan."}
                            </p>
                          </div>
                        )}
                        {analysisResult.canShare &&
                          (analysisResult.reason === "no_previous_report" ||
                            analysisResult.reason ===
                              "no_embedding_first_report") && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                              <p className="text-blue-700 text-sm font-medium">
                                ✅{" "}
                                {analysisResult.reason === "no_previous_report"
                                  ? "Ini akan menjadi report pertama untuk lokasi ini."
                                  : "Update diizinkan karena ini adalah report pertama dengan embedding."}
                              </p>
                            </div>
                          )}
                        {analysisResult.canShare &&
                          analysisResult.reason === "valid" && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                              <p className="text-green-700 text-sm font-medium">
                                ✅ Memenuhi syarat: Grade {analysisResult.grade}{" "}
                                dan similarity{" "}
                                {analysisResult.imageSimilarity
                                  ? `${(
                                      analysisResult.imageSimilarity * 100
                                    ).toFixed(1)}%`
                                  : "N/A"}
                              </p>
                            </div>
                          )}
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-800 mb-3">
                        Deskripsi AI
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        {analysisResult.deskripsi ?? "Tidak tersedia"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6">
            {analysisResult ? (
              <>
                {analysisResult.canShare ? (
                  // Can share - show enabled button
                  <Button
                    onClick={updateReport}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-lg font-medium rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? "Memperbarui..." : "Perbarui Kondisi Lokasi"}
                  </Button>
                ) : (
                  // Cannot share - show disabled button and retry option
                  <div className="space-y-3">
                    <Button
                      disabled={true}
                      className="w-full bg-gray-400 text-gray-600 py-3 text-lg font-medium rounded-xl cursor-not-allowed opacity-50"
                    >
                      Tidak Dapat Dibagikan
                    </Button>
                    <Button
                      onClick={() => {
                        removeImage();
                        setAnalysisResult(null);
                      }}
                      variant="outline"
                      className="w-full py-3 text-lg font-medium rounded-xl"
                    >
                      Coba Gambar Lain
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // No analysis result yet - this should not appear since analysis is triggered from preview section
              !previewUrl && (
                <div className="text-center text-gray-500 text-sm">
                  Pilih atau ambil foto untuk mulai analisis
                </div>
              )
            )}
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
};
