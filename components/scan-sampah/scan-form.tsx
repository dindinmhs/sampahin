"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef} from "react";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";
import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";

export const ScanForm = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isNotTrash, setIsNotTrash] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment"); // Default ke kamera belakang
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUserStore((state) => state.user);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setIsNotTrash(false);
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
      } catch (backCameraError) {
        console.error("Back camera access failed:", backCameraError);
        console.log("Back camera access failed, trying front camera");
        
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
                setCameraError(
                  "Gagal memulai video kamera. Silakan coba lagi."
                );
                setIsCapturing(false); // Reset capturing state on error
              });
            };
          }
        } catch (frontCameraError) {
          console.error("Front camera access failed:", frontCameraError);
          console.log("Front camera access failed, trying generic camera access");
          
          // Last resort - try generic video access
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch((err) => {
                  console.error("Error playing video:", err);
                  setCameraError(
                    "Gagal memulai video kamera. Silakan coba lagi."
                  );
                  setIsCapturing(false); // Reset capturing state on error
                });
              };
            }
          } catch (genericError) {
            throw genericError; // Re-throw to be caught by outer catch block
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
          setCameraError("Kamera yang dipilih tidak tersedia, menggunakan kamera alternatif.");
        }
      } catch (fallbackError) {
        console.error("Error with fallback camera:", fallbackError);
        setCameraError("Tidak dapat mengakses kamera. Silakan periksa izin kamera di browser Anda.");
        setIsCapturing(false); // Reset capturing state on complete failure
      }
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
              setIsNotTrash(false);
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
    setIsNotTrash(false);
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

      const res = await fetch("/api/analisis", {
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
        setIsNotTrash(data.isNotTrash || false);
      } else {
        setAnalysisResult("Gagal menganalisis gambar.");
        setIsNotTrash(false);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisResult("Terjadi kesalahan saat analisis. Silakan coba lagi.");
      setIsNotTrash(false);
    } finally {
      setIsAnalyzing(false);
      const fetchMissions = async () => {
      const supabase = createClient();
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("daily_missions_with_status")
        .select("*")
        .eq(`user_id`, user.id)
        .eq('mission_id', 'b2d3dba2-ef1b-4396-b098-47524b407709')
        .order("point_reward", { ascending: true });
      if (error) {
        console.error("Error fetching missions:", error.message);
      }
      if (data?.length == 0) {
        await supabase
          .from('user_mission_logs')
          .insert([
            { user_id: user.id, mission_id: 'b2d3dba2-ef1b-4396-b098-47524b407709', completed_at : new Date().toISOString(), point_earned:10},
          ])
      }

    };
    fetchMissions()
    }
  };

    

  return (
    <div className=" bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto py-10">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm px-6 py-2">
          {/* Foto Label */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Foto</h2>

            {/* Upload Options */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs px-3 py-1.5 h-8 rounded-full  border-blue-200 text-blue-600 hover:bg-blue-50"
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
                    className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 h-8"
                  >
                    Ganti Kamera
                  </Button>
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-4 py-2 h-8"
                  >
                    Ambil Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="text-xs px-4 py-2 h-8"
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
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line">
                {analysisResult}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Button */}
        <div className="mt-4">
          {analysisResult ? (
            <>
              {isNotTrash ? (
                // Objek bukan sampah - show "Coba Gambar Lain" button
                <Button
                  onClick={() => {
                    removeImage();
                    setAnalysisResult(null);
                  }}
                  variant="outline"
                  className="w-full py-3 text-sm font-medium rounded-full"
                >
                  Coba Gambar Lain
                </Button>
              ) : (
                // Valid trash analysis - show normal analysis button
                <Button
                  onClick={() => {
                    removeImage();
                    setAnalysisResult(null);
                  }}
                  variant="outline"
                  className="w-full py-3 text-sm font-medium rounded-full"
                >
                  Analisis Gambar Lain
                </Button>
              )}
            </>
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
