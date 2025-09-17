"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef, Dispatch, SetStateAction, useEffect } from "react";
import { Camera, Upload, X, RotateCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import { DragCloseDrawer } from "../common/modal";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { mimeToExt } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";

const CoordinatePicker = dynamic(() => import("../common/coordinat-picker"), {
  ssr: false,
});

interface AnalysisResultProps {
  skor_kebersihan: number | null;
  grade: string | null;
  deskripsi: string | null;
}

export const GradingForm = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [open, setOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

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
      setCameraError("Tidak dapat mengakses kamera. Silakan periksa izin kamera di browser.");
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
              const url = URL.createObjectURL(file);
              setPreviewUrl(url);
              stopCamera();
              setAnalysisResult(null);
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

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto py-10">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Grading Lokasi
            </h1>
            <p className="text-slate-600">
              Ambil foto lokasi untuk mendapatkan penilaian kebersihan
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
                      Upload Foto Lokasi
                    </p>
                    <p className="text-sm text-slate-600">
                      Pilih foto lokasi untuk dinilai kebersihannya
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih dari Galeri
                    </Button>
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="border-teal-500 text-teal-500 hover:bg-teal-50"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Buka Kamera
                    </Button>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                📊 Hasil Penilaian
              </h2>
              
              <div className="space-y-6">
                {analysisResult.skor_kebersihan !== null && analysisResult.grade !== null && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 text-center">
                      <h4 className="font-semibold text-teal-800 mb-2">Skor Kebersihan</h4>
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
                      <h4 className="font-semibold text-purple-800 mb-2">Grade</h4>
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
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-3">Deskripsi</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {analysisResult.deskripsi ?? "Tidak tersedia"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Button */}
        {analysisResult && analysisResult.skor_kebersihan !== null && analysisResult.grade !== null && (
          <div className="mt-6">
            <Button
              onClick={() => setOpen(true)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-lg font-medium rounded-xl"
            >
              Bagikan Hasil
            </Button>
          </div>
        )}

        {/* Try Again Button for Non-Grading Images */}
        {analysisResult && (analysisResult.skor_kebersihan === null || analysisResult.grade === null) && (
          <div className="mt-6 text-center">
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

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Share Modal */}
        {selectedImage && analysisResult && analysisResult.skor_kebersihan !== null && analysisResult.grade !== null && (
          <GradeShareForm
            selectedImage={selectedImage}
            analysis_result={analysisResult}
            open={open}
            setOpen={setOpen}
          />
        )}
      </div>
    </div>
  );
};

// Rest of the GradeShareForm component remains the same...
interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  analysis_result: AnalysisResultProps | null;
  selectedImage: File;
}

const GradeShareForm = ({
  open,
  setOpen,
  analysis_result,
  selectedImage,
}: Props) => {
  const [form, setForm] = useState<{
    nama: string;
    alamat: string;
    city: string;
    province: string;
    country: string;
    coord: [number, number];
  }>({
    nama: "",
    alamat: "",
    city: "",
    province: "",
    country: "",
    coord: [-6.89794, 107.63576],
  });
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    // Load default alamat berdasarkan koordinat default
    getAddressFromCoordinates(form.coord[0], form.coord[1]);
  }, []);

  // Fungsi untuk reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lon: number) => {
    setIsLoadingAddress(true);
    try {
      // Menggunakan API route internal untuk menghindari CORS
      const response = await fetch(
        `/api/geocoding?lat=${lat}&lon=${lon}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Ambil alamat dari display_name untuk kolom address
      let city = '';
      let province = '';
      let country = '';
      
      // Extract city, province, country dari address details
      if (data.address) {
        city = data.address.city || data.address.town || data.address.municipality || '';
        province = data.address.state || '';
        country = data.address.country || '';
      }
      
      // Update form dengan alamat yang didapat
      setForm(prev => ({
        ...prev,
        alamat: data.display_name || 'Alamat tidak ditemukan',
        city: city,
        province: province,
        country: country
      }));
      
    } catch (error) {
      console.error('Error getting address:', error);
      
      // Lebih spesifik error handling
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          console.error('Koneksi internet bermasalah.');
        } else if (error.message.includes('rate limit') || error.message.includes('403')) {
          console.error('Terlalu banyak permintaan geocoding.');
        } else {
          console.error('Gagal mendapatkan alamat dari koordinat.');
        }
      } else {
        console.error('Gagal mendapatkan alamat dari koordinat.');
      }
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handler untuk update koordinat dan auto-fill alamat
  const handleCoordinateChange = (newCoord: [number, number]) => {
    setForm(prev => ({ ...prev, coord: newCoord }));
    
    // Auto-fill alamat dari koordinat baru
    getAddressFromCoordinates(newCoord[0], newCoord[1]);
  };

  // Fungsi untuk mendapatkan lokasi saat ini
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung di browser ini.');
      return;
    }

    setIsLoadingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const newCoord: [number, number] = [latitude, longitude];
        setForm(prev => ({ ...prev, coord: newCoord }));
        
        // Auto-fill alamat dari lokasi saat ini
        getAddressFromCoordinates(latitude, longitude);
      },
      (error) => {
        console.error('Error getting current location:', error);
        setIsLoadingAddress(false);
        alert('Gagal mendapatkan lokasi saat ini. Pastikan izin lokasi telah diberikan.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const generateEmbeddings = async (
    text: string, 
    imageBase64: string
  ): Promise<{ textEmbedding: number[] | null; imageEmbedding: number[] | null }> => {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          imageBase64: imageBase64
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embeddings');
      }

      const data = await response.json();
      return {
        textEmbedding: data.textEmbedding,
        imageEmbedding: data.imageEmbedding
      };
    } catch (error) {
      console.error('Error generating embeddings:', error);
      return {
        textEmbedding: null,
        imageEmbedding: null
      };
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Submit function
  const submit = async () => {
    // Validasi form
    if (!form.nama.trim()) {
      alert("Nama harus diisi!");
      return;
    }
    
    if (!form.alamat.trim()) {
      alert("Alamat harus diisi!");
      return;
    }

    setLoading(true);

    try {
      const authRes = await supabase.auth.getUser();

      const fileExt =
        mimeToExt[selectedImage.type as keyof typeof mimeToExt] || "";
      const safeName = form.nama.replace(/\s+/g, "-").toLowerCase();
      const filePath = `locations/${safeName}_${Date.now()}${fileExt}`;

      const storageRes = await supabase.storage
        .from("sampahin")
        .upload(filePath, selectedImage);
      if (storageRes.error) throw storageRes.error;

      const {
        data: { publicUrl },
      } = await supabase.storage.from("sampahin").getPublicUrl(filePath);

      // Tentukan tipe berdasarkan grade
      const locationType = 
        analysis_result?.grade === "A" || analysis_result?.grade === "B"
          ? "clean"
          : "dirty";
          
      const locationRes = await supabase
        .from("locations")
        .insert([
          {
            name: form.nama,
            lan: form.coord[0],
            lat: form.coord[1],
            type: locationType,
            address: form.alamat,
            city: form.city,
            province: form.province,
            country: form.country,
            img_url: publicUrl,
          },
        ])
        .select("id");
      if (!locationRes.data) throw locationRes.error;

      // Prepare text for embedding - gabungkan semua informasi relevan
      const embeddingText = `
        Lokasi: ${form.nama}
        Alamat: ${form.alamat}
        Kota: ${form.city || 'Tidak diketahui'}
        Provinsi: ${form.province || 'Tidak diketahui'}
        Negara: ${form.country || 'Tidak diketahui'}
        Skor Kebersihan: ${analysis_result?.skor_kebersihan || 0}
        Grade: ${analysis_result?.grade || 'N/A'}
        Tipe Lokasi: ${locationType}
        Deskripsi AI: ${analysis_result?.deskripsi || 'Tidak ada deskripsi'}
        Koordinat: ${form.coord[0]}, ${form.coord[1]}
      `.trim();

      // Convert image to base64 for embedding
      const imageBase64 = await fileToBase64(selectedImage);

      // Generate embeddings
      console.log('Generating embeddings...');
      const { textEmbedding, imageEmbedding } = await generateEmbeddings(
        embeddingText, 
        imageBase64
      );

      console.log('Text embedding generated:', textEmbedding ? 'Success' : 'Failed');
      console.log('Image embedding generated:', imageEmbedding ? 'Success' : 'Failed');

      const cleanlinessRes = await supabase
        .from("cleanliness_reports")
        .insert([
          {
            reporter: authRes.data.user?.id,
            location: locationRes.data[0].id,
            score: analysis_result?.skor_kebersihan,
            grade: analysis_result?.grade,
            ai_description: analysis_result?.deskripsi,
            text_embedding: textEmbedding,
            image_embedding: imageEmbedding,
          },
        ])
        .select();

      if (cleanlinessRes.error) throw cleanlinessRes.error;
      
      if (cleanlinessRes.data) {
        console.log('Data saved successfully with embeddings');
        setOpen(false);
        // Redirect ke /map setelah berhasil submit
        window.location.href = "/map";
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
      const fetchMissions = async () => {
      const supabase = createClient();
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("daily_missions_with_status")
        .select("*")
        .eq(`user_id`, user.id)
        .eq('mission_id', '0e77a8e0-3309-46f2-b3b3-e2d77820429a')
        .order("point_reward", { ascending: true });
      if (error) {
        console.error("Error fetching missions:", error.message);
      }
      if (data?.length == 0) {
        await supabase
          .from('user_mission_logs')
          .insert([
            { user_id: user.id, mission_id: '0e77a8e0-3309-46f2-b3b3-e2d77820429a', completed_at : new Date().toISOString(), point_earned:10},
          ])
      }

    };
    fetchMissions()
    }
  };

  return (
    <DragCloseDrawer open={open} setOpen={setOpen}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="nama" className="text-sm font-medium text-gray-700">
              Nama <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nama"
              type="text"
              placeholder="Masukkan Nama"
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label
                htmlFor="alamat"
                className="text-sm font-medium text-gray-700"
              >
                Alamat <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoadingAddress}
                className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 h-8 rounded-full"
              >
                {isLoadingAddress ? "Loading..." : "Lokasi Saat Ini"}
              </Button>
            </div>
            <Input
              id="alamat"
              type="text"
              placeholder="Alamat akan terisi otomatis berdasarkan koordinat"
              value={form.alamat}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              disabled={true} // Always disabled - only filled from coordinates
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              {isLoadingAddress 
                ? "Sedang mendapatkan alamat..." 
                : "Alamat akan berubah otomatis saat Anda memilih koordinat di peta"
              }
            </p>
          </div>

          <CoordinatePicker
            value={form.coord}
            onChange={handleCoordinateChange}
          />
          
          <div className="flex items-center gap-2 justify-end">
            {!loading && (
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Batal
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || !form.nama.trim() || !form.alamat.trim()} 
              onClick={submit}
              className={`${
                loading || !form.nama.trim() || !form.alamat.trim()
                  ? "opacity-50 cursor-not-allowed" 
                  : ""
              }`}
            >
              {loading ? "Membagikan..." : "Bagikan"}
            </Button>
          </div>
        </div>
      </div>
    </DragCloseDrawer>
  );
};