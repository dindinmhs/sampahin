"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";
import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { WasteEducation } from "./waste-education-ai";

// AI Education data interface
interface AIEducationData {
  title: string;
  description: string;
  environmentalImpact: {
    positive: string[];
    negative: string[];
  };
  recyclingProcess: {
    steps: string[];
    difficulty: string;
    timeRequired: string;
  };
  tips: {
    reduce: string[];
    reuse: string[];
    recycle: string[];
  };
  funFacts: string[];
  economicValue: {
    price: string;
    potential: string;
  };
  personalizedAdvice: string;
  generatedAt: string;
  wasteType: string;
  confidence: number;
  isfallback?: boolean;
}

// Interface untuk hasil analisis basic
interface BasicAnalysis {
  namaObjek: string;
  kategori: string;
  statusBahaya: string;
  waktuTerurai: string;
  produkReuse: string;
  langkahLangkah: string[];
  nilaiEkonomi: string;
}

// Interface untuk response API gabungan
interface CombinedAnalysisResponse {
  result: string;
  isNotTrash: boolean;
  isDemo: boolean;
  detectedType: string | null;
  basicAnalysis: BasicAnalysis | null;
  aiEducation: AIEducationData | null;
}

// Interface untuk hasil analisis yang terstruktur (untuk parsing text)
interface AnalysisResult {
  namaObjek?: string;
  kategori?: string;
  statusBahaya?: string;
  waktuTerurai?: string;
  produkReuse?: string;
  langkahLangkah?: string[];
  nilaiEkonomi?: string;
  rawText?: string;
}

// Fungsi untuk memparse hasil analisis menjadi struktur yang rapi
const parseAnalysisResult = (result: string): AnalysisResult => {
  if (!result || result.toLowerCase().includes("objek bukanlah sampah")) {
    return { rawText: result };
  }

  const parsed: AnalysisResult = { rawText: result };

  // Parse setiap field
  const namaMatch = result.match(/Nama objek:\s*([^\n]+)/i);
  if (namaMatch) parsed.namaObjek = namaMatch[1].trim();

  const kategoriMatch = result.match(/Kategori:\s*([^\n]+)/i);
  if (kategoriMatch) parsed.kategori = kategoriMatch[1].trim();

  const bahayaMatch = result.match(/Status bahaya:\s*([^\n]+)/i);
  if (bahayaMatch) parsed.statusBahaya = bahayaMatch[1].trim();

  const waktuMatch = result.match(/Waktu terurai:\s*([^\n]+)/i);
  if (waktuMatch) parsed.waktuTerurai = waktuMatch[1].trim();

  const reuseMatch = result.match(/Produk reuse:\s*([^\n]+)/i);
  if (reuseMatch) parsed.produkReuse = reuseMatch[1].trim();

  const ekonomiMatch = result.match(/Nilai ekonomi:\s*([^\n]+)/i);
  if (ekonomiMatch) parsed.nilaiEkonomi = ekonomiMatch[1].trim();

  // Parse langkah-langkah
  const langkahSection = result.match(
    /Langkah-langkah:\s*([\s\S]*?)(?=Nilai ekonomi:|$)/i
  );
  if (langkahSection) {
    const steps = langkahSection[1]
      .split(/\d+\./)
      .filter((step) => step.trim())
      .map((step) => step.trim());
    parsed.langkahLangkah = steps;
  }

  return parsed;
};

export const ScanForm = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [basicAnalysis, setBasicAnalysis] = useState<BasicAnalysis | null>(
    null
  );
  const [detectedWasteType, setDetectedWasteType] = useState<string | null>(
    null
  );
  const [isNotTrash, setIsNotTrash] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  ); // Default ke kamera belakang
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUserStore((state) => state.user);
  const [aiEducation, setAiEducation] = useState<AIEducationData | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setBasicAnalysis(null);
      setIsNotTrash(false);
      setAiEducation(null);
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
          console.log(
            "Front camera access failed, trying generic camera access"
          );

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
              setBasicAnalysis(null);
              setAiEducation(null);
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
    setBasicAnalysis(null);
    setDetectedWasteType(null);
    setAiEducation(null);
    setIsNotTrash(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Enhanced helper function to detect waste type from AI analysis result
  const detectWasteType = (analysisText: string): string => {
    const text = analysisText.toLowerCase();

    // Advanced keyword matching with scoring system
    const wasteKeywords = {
      botol_plastik: [
        "botol plastik",
        "pet bottle",
        "plastic bottle",
        "minuman plastik",
        "aqua",
        "le minerale",
        "coca cola",
        "pepsi",
        "sprite",
        "fanta",
        "botol air",
        "water bottle",
        "drinking bottle",
        "beverage bottle",
      ],
      botol_kaca: [
        "botol kaca",
        "glass bottle",
        "wine bottle",
        "beer bottle",
        "kaca",
        "glass",
        "botol bir",
        "botol wine",
        "parfum bottle",
        "medicine bottle",
        "syrup bottle",
        "olive oil bottle",
      ],
      kaleng_aluminium: [
        "kaleng",
        "aluminium",
        "aluminum",
        "can",
        "soda can",
        "beverage can",
        "drink can",
        "metal can",
        "soft drink can",
        "coca cola can",
        "pepsi can",
        "beer can",
        "energy drink can",
      ],
      kantong_plastik: [
        "kantong plastik",
        "plastic bag",
        "shopping bag",
        "kresek",
        "tas plastik",
        "kantong belanja",
        "grocery bag",
        "carrier bag",
        "polybag",
        "plastic sack",
        "shopping plastic",
      ],
      styrofoam: [
        "styrofoam",
        "polystyrene",
        "foam container",
        "takeaway box",
        "wadah styrofoam",
        "kotak makan",
        "foam box",
        "disposable container",
        "white foam",
        "packaging foam",
        "insulation foam",
      ],
      kertas: [
        "kertas",
        "kardus",
        "koran",
        "majalah",
        "buku",
        "karton",
        "paper",
        "cardboard",
        "newspaper",
        "magazine",
        "book",
        "tissue",
        "tisu",
        "nota",
        "receipt",
        "packaging paper",
        "box",
        "carton",
        "envelope",
        "wrapper paper",
      ],
      sampah_organik: [
        "organik",
        "makanan",
        "buah",
        "sayuran",
        "sisa makanan",
        "kulit buah",
        "daun",
        "ranting",
        "organic",
        "food waste",
        "fruit peel",
        "vegetable",
        "apple",
        "banana",
        "orange",
        "tomato",
        "carrot",
        "lettuce",
        "bread",
        "rice",
        "nasi",
      ],
    };

    // Calculate confidence scores for each waste type
    const scores: Record<string, number> = {};

    Object.entries(wasteKeywords).forEach(([wasteType, keywords]) => {
      scores[wasteType] = 0;
      keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          // Give higher score for more specific matches
          const specificity = keyword.length > 8 ? 2 : 1;
          scores[wasteType] += specificity;
        }
      });
    });

    // Find the waste type with highest confidence score
    let bestMatch = "botol_plastik"; // default
    let maxScore = 0;

    Object.entries(scores).forEach(([wasteType, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestMatch = wasteType;
      }
    });

    // Log detection results for debugging (remove in production)
    console.log("AI Analysis Detection:", {
      analysisText: text,
      scores,
      detectedType: bestMatch,
      confidence: maxScore,
    });

    return bestMatch;
  };

  const handleAnalysis = async () => {
    if (!selectedImage) {
      alert("Silakan pilih gambar terlebih dahulu");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setDetectedWasteType(null);

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

      const data = (await res.json()) as CombinedAnalysisResponse;
      if (data.result) {
        setAnalysisResult(data.result);
        setIsNotTrash(data.isNotTrash || false);
        setBasicAnalysis(data.basicAnalysis);

        // Set AI education if available from combined response
        if (data.aiEducation) {
          setAiEducation(data.aiEducation);
        }

        // Detect waste type from analysis result
        if (!data.isNotTrash) {
          // Use provided type from API if available, otherwise detect from text
          const wasteType = data.detectedType || detectWasteType(data.result);
          setDetectedWasteType(wasteType);

          // Log analysis results
          console.log("🎯 Gemini AI Detection Result:", {
            originalAnalysis: data.result,
            detectedType: wasteType,
            isRealAI: !data.isDemo,
            hasEducation: !!data.aiEducation,
            timestamp: new Date().toISOString(),
          });

          // Show success message for real AI
          if (!data.isDemo) {
            console.log("🤖 Real Gemini AI analysis completed successfully!");
            if (data.aiEducation) {
              console.log("📚 AI Education included in response!");
            }
          }
        }
      } else {
        setAnalysisResult("Gagal menganalisis gambar.");
        setIsNotTrash(false);
      }
    } catch (err) {
      console.error("Analysis error:", err);

      // Provide more specific error messages
      let errorMessage = "Terjadi kesalahan saat analisis. ";

      if (err instanceof Error) {
        if (err.message.includes("500")) {
          errorMessage +=
            "Server sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.";
        } else if (err.message.includes("network")) {
          errorMessage += "Periksa koneksi internet Anda dan coba lagi.";
        } else {
          errorMessage +=
            "Silakan coba lagi atau gunakan foto yang lebih jelas.";
        }
      } else {
        errorMessage += "Silakan coba lagi.";
      }

      setAnalysisResult(errorMessage);
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
          .eq("mission_id", "b2d3dba2-ef1b-4396-b098-47524b407709")
          .order("point_reward", { ascending: true });
        if (error) {
          console.error("Error fetching missions:", error.message);
        }
        if (data?.length == 0) {
          await supabase.from("user_mission_logs").insert([
            {
              user_id: user.id,
              mission_id: "b2d3dba2-ef1b-4396-b098-47524b407709",
              completed_at: new Date().toISOString(),
              point_earned: 10,
            },
          ]);
        }
      };
      fetchMissions();
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto py-10">
        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Scan Sampah
              </h1>
            </div>
            <p className="text-slate-600">
              Ambil foto sampah untuk mendapat informasi lengkap tentang jenis,
              dampak lingkungan, cara daur ulang, dan nilai ekonomi
            </p>
          </div>

          {/* Foto Label */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">
              Upload Foto Sampah
            </h2>

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
              {isNotTrash ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Hasil Analisis AI
                    </h3>
                  </div>
                  <div className="text-sm text-yellow-700 mb-3">
                    <div className="whitespace-pre-line">{analysisResult}</div>
                  </div>
                  <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                    💡 <strong>Tips:</strong> Coba foto sampah yang lebih jelas
                    atau dari sudut yang berbeda untuk hasil analisis yang lebih
                    akurat.
                  </div>
                </div>
              ) : (
                <>
                  {/* AI Analysis Summary */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <h3 className="text-sm font-medium text-emerald-800">
                        Analisis Berhasil
                      </h3>
                    </div>
                    <div className="text-sm text-emerald-700 mb-2">
                      {(() => {
                        // Use structured basicAnalysis if available, otherwise parse text
                        if (basicAnalysis) {
                          return (
                            <div className="space-y-3">
                              {/* Nama & Kategori */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                  <div className="text-xs font-semibold text-emerald-600 mb-1">
                                    NAMA OBJEK
                                  </div>
                                  <div className="font-medium text-emerald-800">
                                    {basicAnalysis.namaObjek}
                                  </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <div className="text-xs font-semibold text-blue-600 mb-1">
                                    KATEGORI
                                  </div>
                                  <div className="font-medium text-blue-800">
                                    {basicAnalysis.kategori}
                                  </div>
                                </div>
                              </div>

                              {/* Status & Waktu */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                  <div className="text-xs font-semibold text-orange-600 mb-1">
                                    STATUS BAHAYA
                                  </div>
                                  <div className="font-medium text-orange-800">
                                    {basicAnalysis.statusBahaya}
                                  </div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                  <div className="text-xs font-semibold text-red-600 mb-1">
                                    WAKTU TERURAI
                                  </div>
                                  <div className="font-medium text-red-800">
                                    {basicAnalysis.waktuTerurai}
                                  </div>
                                </div>
                              </div>

                              {/* Reuse Ideas */}
                              {basicAnalysis.produkReuse && (
                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                  <div className="text-xs font-semibold text-purple-600 mb-1">
                                    💡 IDE DAUR ULANG
                                  </div>
                                  <div className="font-medium text-purple-800">
                                    {basicAnalysis.produkReuse}
                                  </div>
                                </div>
                              )}

                              {/* Langkah-langkah */}
                              {basicAnalysis.langkahLangkah &&
                                basicAnalysis.langkahLangkah.length > 0 && (
                                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                    <div className="text-xs font-semibold text-indigo-600 mb-2">
                                      📋 LANGKAH-LANGKAH
                                    </div>
                                    <ol className="space-y-1">
                                      {basicAnalysis.langkahLangkah.map(
                                        (step: string, index: number) => (
                                          <li
                                            key={index}
                                            className="flex items-start gap-2"
                                          >
                                            <span className="bg-indigo-200 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                              {index + 1}
                                            </span>
                                            <span className="text-indigo-800 text-xs">
                                              {step}
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ol>
                                  </div>
                                )}

                              {/* Nilai Ekonomi */}
                              {basicAnalysis.nilaiEkonomi && (
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                  <div className="text-xs font-semibold text-green-600 mb-1">
                                    💰 NILAI EKONOMI
                                  </div>
                                  <div className="font-medium text-green-800">
                                    {basicAnalysis.nilaiEkonomi}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Fallback to parsing text if basicAnalysis is not available
                        const parsed = parseAnalysisResult(analysisResult);
                        if (!parsed.namaObjek) {
                          return (
                            <div className="whitespace-pre-line">
                              {analysisResult}
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {/* Nama & Kategori */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <div className="text-xs font-semibold text-emerald-600 mb-1">
                                  NAMA OBJEK
                                </div>
                                <div className="font-medium text-emerald-800">
                                  {parsed.namaObjek}
                                </div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="text-xs font-semibold text-blue-600 mb-1">
                                  KATEGORI
                                </div>
                                <div className="font-medium text-blue-800">
                                  {parsed.kategori}
                                </div>
                              </div>
                            </div>

                            {/* Status & Waktu */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <div className="text-xs font-semibold text-orange-600 mb-1">
                                  STATUS BAHAYA
                                </div>
                                <div className="font-medium text-orange-800">
                                  {parsed.statusBahaya}
                                </div>
                              </div>
                              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                <div className="text-xs font-semibold text-red-600 mb-1">
                                  WAKTU TERURAI
                                </div>
                                <div className="font-medium text-red-800">
                                  {parsed.waktuTerurai}
                                </div>
                              </div>
                            </div>

                            {/* Reuse Ideas */}
                            {parsed.produkReuse && (
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <div className="text-xs font-semibold text-purple-600 mb-1">
                                  💡 IDE DAUR ULANG
                                </div>
                                <div className="font-medium text-purple-800">
                                  {parsed.produkReuse}
                                </div>
                              </div>
                            )}

                            {/* Langkah-langkah */}
                            {parsed.langkahLangkah &&
                              parsed.langkahLangkah.length > 0 && (
                                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                  <div className="text-xs font-semibold text-indigo-600 mb-2">
                                    📋 LANGKAH-LANGKAH
                                  </div>
                                  <ol className="space-y-1">
                                    {parsed.langkahLangkah.map(
                                      (step: string, index: number) => (
                                        <li
                                          key={index}
                                          className="flex items-start gap-2"
                                        >
                                          <span className="bg-indigo-200 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                            {index + 1}
                                          </span>
                                          <span className="text-indigo-800 text-xs">
                                            {step}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ol>
                                </div>
                              )}

                            {/* Nilai Ekonomi */}
                            {parsed.nilaiEkonomi && (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="text-xs font-semibold text-green-600 mb-1">
                                  💰 NILAI EKONOMI
                                </div>
                                <div className="font-medium text-green-800">
                                  {parsed.nilaiEkonomi}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* AI Education Content */}
                  {detectedWasteType && aiEducation && (
                    <WasteEducation aiEducation={aiEducation} />
                  )}
                </>
              )}
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
