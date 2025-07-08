"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";

export const ScanForm = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
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
            facingMode: facingMode,
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
        console.log("Front camera access failed, trying generic camera access");
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
          console.log("Generic camera access failed, trying back camera");
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
      } else {
        setAnalysisResult("Gagal menganalisis gambar.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisResult("Terjadi kesalahan saat analisis. Silakan coba lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Scan Sampah
      </h1>

      {/* Upload Options */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
            disabled={isCapturing}
          >
            <Upload className="w-4 h-4" />
            Pilih File
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            className="flex items-center gap-2"
            disabled={isCapturing}
          >
            <Camera className="w-4 h-4" />
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
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {cameraError}
        </div>
      )}

      {/* Camera View */}
      {isCapturing && (
        <div className="mb-6 text-center">
          <div className="relative inline-block w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-video rounded-lg border-2 border-gray-300"
            />
            <div className="mt-4 flex gap-4 justify-center">
              <Button
                type="button"
                onClick={capturePhoto}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ambil Foto
              </Button>
              <Button
                type="button"
                onClick={toggleCamera}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Ganti Kamera
              </Button>
              <Button type="button" variant="outline" onClick={stopCamera}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && !isCapturing && (
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <Image
              src={previewUrl}
              width={500}
              height={500}
              alt="Preview"
              className="max-w-full h-auto max-h-96 rounded-lg border-2 border-gray-300 shadow-md object-contain"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white border-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {selectedImage?.name || "Foto dari kamera"}
          </p>
        </div>
      )}

      {/* Analysis Button */}
      <div className="text-center">
        <Button
          onClick={handleAnalysis}
          disabled={!selectedImage || isAnalyzing}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-2 text-lg w-full"
        >
          {isAnalyzing ? "Menganalisis..." : "Analisis"}
        </Button>

        {/* Analysis Result */}
        {analysisResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left whitespace-pre-line text-sm">
            <h3 className="font-semibold text-gray-800 mb-2">
              Hasil Analisis:
            </h3>
            <div className="text-gray-700">{analysisResult}</div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
