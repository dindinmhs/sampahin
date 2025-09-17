"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Camera, Upload, X, RotateCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { KreasiCards } from "./kreasi-cards";
import { BasicAnalysis, CreativeArticle, AnalysisResponse } from "@/types/scan";
import {
  validateAndCompressImage,
  fileToBase64,
  formatFileSize,
} from "@/lib/utils/image-compression";

export const ScanForm = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [basicAnalysis, setBasicAnalysis] = useState<BasicAnalysis | null>(
    null
  );
  const [kreatiArticles, setKreatiArticles] = useState<
    CreativeArticle[] | null
  >(null);
  const [isNotTrash, setIsNotTrash] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMessage, setCompressionMessage] = useState<string | null>(
    null
  );
  const [fileError, setFileError] = useState<string | null>(null);

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
    resetAnalysisStates();
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

  const resetAnalysisStates = () => {
    setAnalysisResult(null);
    setBasicAnalysis(null);
    setKreatiArticles(null);
    setIsNotTrash(false);
    setIsGeneratingImages(false);
    setFileError(null);
    setCompressionMessage(null);
  };

  const generateKreasiImages = async (
    articles: CreativeArticle[]
  ): Promise<CreativeArticle[]> => {
    try {
      setIsGeneratingImages(true);

      // Extract all titles from articles
      const titles = articles.map((article) => article.title);

      // Send titles to Nano Banana for image generation
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const imageData = await res.json();

      // Update articles with generated images
      if (imageData.images && Array.isArray(imageData.images)) {
        return articles.map((article, index) => {
          const imageResult = imageData.images[index];
          return {
            ...article,
            imageUrl: imageResult?.success ? imageResult.imageUrl : null,
          };
        });
      }

      return articles;
    } catch (error) {
      console.error("Error generating images with Gemini:", error);
      return articles; // Return original articles if image generation fails
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCapturing(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setFacingMode("environment");
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
            setCameraError("Gagal memutar video kamera");
          });
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Tidak dapat mengakses kamera. Silakan periksa izin kamera di browser."
      );
      setIsCapturing(false);
    }
  };

  const toggleCamera = async () => {
    setCameraError(null);

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
            setCameraError("Gagal memutar video kamera");
          });
        };
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      setCameraError("Gagal mengganti kamera. Silakan coba lagi.");
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
              resetAnalysisStates();
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

                const url = URL.createObjectURL(finalFile);
                setPreviewUrl(url);
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
    resetAnalysisStates();
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
    resetAnalysisStates();

    try {
      const base64Image = await fileToBase64(selectedImage);

      const res = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as AnalysisResponse;

      console.log("🔥 Frontend received data:", {
        hasResult: !!data.result,
        hasBasicAnalysis: !!data.basicAnalysis,
        hasKreatiArticles: !!data.kreatiArticles,
        isNotTrash: data.isNotTrash,
        responseKeys: Object.keys(data),
      });

      if (data.basicAnalysis && data.kreatiArticles) {
        const analysisText = `Nama objek: ${data.basicAnalysis.namaObjek}
Kategori: ${data.basicAnalysis.kategori}
Status bahaya: ${data.basicAnalysis.statusBahaya}`;

        setAnalysisResult(analysisText);
        setIsNotTrash(data.isNotTrash || false);
        setBasicAnalysis(data.basicAnalysis || null);

        // Generate images with Gemini before setting the articles
        console.log("🖼️ Generating images with Gemini...");
        const processedArticles = await generateKreasiImages(
          data.kreatiArticles
        );
        setKreatiArticles(processedArticles);

        console.log("📚 Kreasi Articles processed and set successfully!");
        console.log("✅ All states updated successfully!");
      } else if (data.result) {
        setAnalysisResult(data.result);
        setIsNotTrash(data.isNotTrash || false);
        setBasicAnalysis(data.basicAnalysis || null);

        // If we have kreatiArticles, generate images for them too
        if (data.kreatiArticles) {
          console.log("🖼️ Generating images with Gemini...");
          const processedArticles = await generateKreasiImages(
            data.kreatiArticles
          );
          setKreatiArticles(processedArticles);
        } else {
          setKreatiArticles(null);
        }

        console.log("✅ All states updated successfully!");
      } else {
        console.error("❌ No valid analysis data received:", data);
        setAnalysisResult("Gagal menganalisis gambar.");
        setIsNotTrash(false);
      }
    } catch (err) {
      console.error("Analysis error:", err);

      let errorMessage = "Terjadi kesalahan saat analisis. ";
      if (err instanceof Error) {
        if (err.message.includes("500")) {
          errorMessage += "Server mengalami masalah. ";
        } else if (err.message.includes("network")) {
          errorMessage += "Masalah koneksi internet. ";
        } else {
          errorMessage += `Error: ${err.message}`;
        }
      } else {
        errorMessage += "Silakan coba lagi.";
      }

      setAnalysisResult(errorMessage);
      setIsNotTrash(false);
    } finally {
      setIsAnalyzing(false);

      // Handle mission completion
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
          console.error("Error fetching missions:", error);
        }

        if (data?.length == 0) {
          // Handle mission completion logic here
        }
      };
      fetchMissions();
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto py-10">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Scan Sampah AI
            </h1>
            <p className="text-slate-600">
              Scan sampah untuk mendapatkan analisis dan ide kreasi DIY
            </p>
          </div>

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
                      Upload Gambar Sampah
                    </p>
                    <p className="text-sm text-slate-600">
                      Pilih foto sampah untuk dianalisis
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih dari Galeri
                    </Button>
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="border-teal-600 text-teal-600 hover:bg-teal-50"
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

          {/* Camera Section */}
          {isCapturing && (
            <div className="space-y-4">
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
                    className="bg-teal-600 hover:bg-teal-700 text-white"
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
          {previewUrl && (
            <div className="space-y-4">
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
                  disabled={isAnalyzing || isGeneratingImages}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Menganalisis...
                    </>
                  ) : isGeneratingImages ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Membuat gambar kreasi...
                    </>
                  ) : (
                    "Analisis Sampah"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                🔬 Hasil Analisis
              </h2>

              {isNotTrash ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                  <div className="text-6xl mb-4">🤔</div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">
                    Objek Bukan Sampah
                  </h3>
                  <p className="text-yellow-700">
                    Objek yang difoto sepertinya bukan sampah atau limbah.
                    Silakan foto objek sampah yang ingin dianalisis.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {basicAnalysis && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          Nama Objek
                        </h4>
                        <p className="text-blue-700">
                          {basicAnalysis.namaObjek}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-2">
                          Kategori
                        </h4>
                        <p className="text-purple-700">
                          {basicAnalysis.kategori}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">
                          Status Bahaya
                        </h4>
                        <p className="text-orange-700">
                          {basicAnalysis.statusBahaya}
                        </p>
                      </div>
                    </div>
                  )}

                  {!basicAnalysis && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <pre className="text-slate-800 whitespace-pre-wrap text-sm">
                        {analysisResult}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kreasi Articles */}
        {!isNotTrash &&
          !isGeneratingImages &&
          kreatiArticles &&
          kreatiArticles.length > 0 && (
            <KreasiCards
              articles={kreatiArticles}
              wasteObject={basicAnalysis?.namaObjek}
            />
          )}

        {/* Generating Images State */}
        {isGeneratingImages && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-emerald-600 text-white p-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold">Kreasi DIY</h3>
                  <p className="text-emerald-100 text-sm mt-1">
                    Sedang membuat gambar dengan Gemini AI
                  </p>
                </div>
              </div>
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-emerald-600" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Membuat gambar kreasi...
                </h3>
                <p className="text-gray-600 text-sm">
                  Gemini sedang membuat gambar menarik untuk setiap ide kreasi
                  Anda
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
