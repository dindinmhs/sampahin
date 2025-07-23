"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { LocationType } from "@/types/location";
import { mimeToExt } from "@/lib/utils";

const CoordinatePicker = dynamic(() => import("../common/coordinat-picker"), {
  ssr: false,
});

interface AnalysisResultProps {
  skor_kebersihan: number | null;
  grade: string | null;
  deskripsi: string | null;
}

export const UpdateGradingForm = () => {
    const supabase = createClient()
    const params = useParams();
    const placeId = params.place_id
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationType[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResultProps | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        setIsCapturing(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error("Error playing video:", err);
              setCameraError("Gagal memulai video kamera. Silakan coba lagi.");
            });
          };
        }
      } catch (initialError) {
        console.error("Front camera access failed:", initialError);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          setIsCapturing(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch((err) => {
                console.error("Error playing video:", err);
                setCameraError(
                  "Gagal memulai video kamera. Silakan coba lagi."
                );
              });
            };
          }
        } catch (fallbackError) {
          console.error("Generic camera access failed:", fallbackError);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          setIsCapturing(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch((err) => {
                console.error("Error playing video:", err);
                setCameraError(
                  "Gagal memulai video kamera. Silakan coba lagi."
                );
              });
            };
          }
        }
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
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        };
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      setCameraError("Gagal mengganti kamera. Silakan coba lagi.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "camera-photo.jpg", {
                type: "image/jpeg",
              });
              setSelectedImage(file);
              setPreviewUrl(URL.createObjectURL(file));
              setAnalysisResult(null);
              stopCamera();
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
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = (error) => reject(error);
        });

      const base64Image = await toBase64(selectedImage);

      const res = await fetch("/api/grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.result) {
        setAnalysisResult(data.result);
      } else {
        setAnalysisResult({
          skor_kebersihan: null,
          grade: null,
          deskripsi: "Gagal menganalisis gambar.",
        });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisResult({
        skor_kebersihan: null,
        grade: null,
        deskripsi: "Terjadi kesalahan saat analisis. Silakan coba lagi.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  useEffect(()=>{
    const getLocation = async () => {
        const { data: locations, error } = await supabase
          .from('locations')
          .select("*")
          .eq('id', placeId)
      
          if (error) console.error(error)

        setLocation(locations)
    }
    
    getLocation()
  },[placeId, supabase])

  const updateReport = async () => {
    if (selectedImage && location) {
        setLoading(true);

        const authRes = await supabase.auth.getUser();
        const fileExt = mimeToExt[selectedImage.type as keyof typeof mimeToExt] || "";
        const safeName = location[0].name.replace(/\s+/g, "-").toLowerCase();
        const filePath = `locations/${safeName}_${Date.now()}${fileExt}`;

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

        await supabase.storage
            .from("sampahin")
            .remove([pathInBucket]);
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

        // 5. Update lokasi dengan URL gambar baru
        const locationRes = await supabase
        .from("locations")
        .update([
            {
            img_url: publicUrl,
            },
        ])
        .eq("id", placeId)
        .select("id");

        if (!locationRes.data) throw locationRes.error;

        // 6. Tambahkan laporan kebersihan
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
        if (cleanlinessRes.data) setLoading(false);
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
            <h2 className="text-xl font-bold mb-5">Laporkan Kondisi Terkini</h2>
            <CoordinatePicker
                value={[location[0].lan, location[0].lat]}
                readOnly={true}
            />
            <p className="my-2 font-medium">{location[0].name}</p>
            <p className="text-sm text-gray-500">{location[0].address}</p>
            <h2 className="text-sm font-medium text-gray-700 mb-3 mt-6">Foto</h2>

            {/* Upload Options */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs px-3 py-1.5 h-8 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
                disabled={isCapturing}
              >
                <Upload className="w-3 h-3" />
                Pilih Foto
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={startCamera}
                className="flex items-center gap-2 text-xs px-3 py-1.5 h-8 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
                disabled={isCapturing}
              >
                <Camera className="w-3 h-3" />
                Buka Kamera
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {cameraError}
            </div>
          )}

          {/* Camera View */}
          {isCapturing && (
            <div className="mb-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video rounded-2xl border border-gray-200"
                />
                <div className="mt-3 flex gap-2 justify-center">
                  <Button
                    type="button"
                    onClick={toggleCamera}
                    className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 h-8 rounded-full"
                  >
                    Ganti Kamera
                  </Button>
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-4 py-2 h-8 rounded-full"
                  >
                    Ambil Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="text-xs px-4 py-2 h-8 rounded-full"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {previewUrl && !isCapturing && (
            <div className="mb-4">
              <div className="relative">
                <Image
                  src={previewUrl}
                  width={400}
                  height={300}
                  alt="Preview"
                  className="w-full h-48 rounded-lg border border-gray-200 object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white border-red-500 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">
                Hasil Analisis AI
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <div className="space-y-2">
                  {/* Only show score and grade if it's a valid grading result */}
                  {analysisResult.skor_kebersihan !== null && analysisResult.grade !== null && (
                    <div className="flex justify-start gap-8">
                      <div className="flex flex-col justify-center items-center">
                        <span className="font-medium">Skor Kebersihan:</span>
                        <span
                          className={`font-bold px-2 py-1 rounded text-4xl ${
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
                      <div className="flex flex-col justify-center items-center">
                        <span className="font-medium">Grade:</span>
                        <span
                          className={`font-bold px-2 py-1 rounded text-4xl ${
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
                  <div className={analysisResult.skor_kebersihan !== null && analysisResult.grade !== null ? "mt-3 pt-2 border-t border-gray-200" : ""}>
                    <p className="text-gray-600 leading-relaxed">
                      {analysisResult.deskripsi ?? "Tidak tersedia"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis/Share Button */}
        <div className="mt-4">
          {analysisResult ? (
            <Button
              onClick={updateReport}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-sm font-medium rounded-full"
              disabled={analysisResult?.grade !== "D" || isLoading}
            >
              {isLoading?"Bagikan...":"Bagikan"}
            </Button>
          ) : (
            <Button
              onClick={handleAnalysis}
              disabled={!selectedImage || isAnalyzing}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-sm font-medium rounded-full"
            >
              {isAnalyzing ? "Menganalisis..." : "Analisis"}
            </Button>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

      </div>
    </div>
  );
};
