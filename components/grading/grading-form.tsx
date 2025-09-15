"use client";

import { Button } from "@/components/ui/button";
import { useState, useRef, Dispatch, SetStateAction } from "react";
import { Camera, Upload, X } from "lucide-react";
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment"); // Default ke kamera belakang

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

  return (
    <div className="bg-gray-50 p-4 min-h-screen">
      <div className="max-w-2xl mx-auto py-10">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm px-6 py-2">
          {/* Foto Label */}
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Foto Lokasi untuk di grading</h2>

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
              aria-label="Upload image file"
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
            <>
              {analysisResult.skor_kebersihan !== null && analysisResult.grade !== null ? (
                // Valid grading result - show share button
                <Button
                  onClick={() => setOpen(true)}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-sm font-medium rounded-full"
                >
                  Bagikan
                </Button>
              ) : (
                // Not a grading image - show "Coba Gambar Lain" button
                <div className="text-center">
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
                </div>
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

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  analysis_result: AnalysisResultProps | null;
  selectedImage: File;
}

// ...existing code...

const GradeShareForm = ({
  open,
  setOpen,
  analysis_result,
  selectedImage,
}: Props) => {
  const [form, setForm] = useState<{
    nama: string;
    alamat: string;
    coord: [number, number];
  }>({
    nama: "",
    alamat: "",
    coord: [-6.89794, 107.63576],
  });
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const user = useUserStore((state) => state.user);

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
      
      console.log('=== REVERSE GEOCODING RESULT ===');
      console.log('Raw API Response:', data);
      console.log('Display Name:', data.display_name);
      console.log('Address Details:', data.address);
      
      // Format alamat yang lebih rapi
      let formattedAddress = '';
      
      if (data.address) {
        const addressParts = [];
        
        // Prioritas urutan alamat untuk Indonesia
        if (data.address.house_number) addressParts.push(data.address.house_number);
        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.neighbourhood) addressParts.push(data.address.neighbourhood);
        if (data.address.suburb) addressParts.push(data.address.suburb);
        if (data.address.village) addressParts.push(data.address.village);
        if (data.address.city_district) addressParts.push(data.address.city_district);
        if (data.address.city || data.address.town || data.address.municipality) {
          addressParts.push(data.address.city || data.address.town || data.address.municipality);
        }
        if (data.address.county) addressParts.push(data.address.county);
        if (data.address.state) addressParts.push(data.address.state);
        if (data.address.postcode) addressParts.push(data.address.postcode);
        
        formattedAddress = addressParts.join(', ');
      }
      
      // Fallback ke display_name jika formatted address kosong
      if (!formattedAddress && data.display_name) {
        // Bersihkan display_name untuk alamat Indonesia
        formattedAddress = data.display_name
          .replace(/,\s*Indonesia$/, '') // Hapus "Indonesia" di akhir
          .replace(/,\s*\d{5}$/, ''); // Hapus kode pos di akhir jika ada
      }
      
      console.log('=== FORMATTED ADDRESS ===');
      console.log('Before:', form.alamat);
      console.log('After:', formattedAddress);
      console.log('Address Parts Available:', data.address ? Object.keys(data.address) : 'None');
      console.log('================================');
      
      // Update form dengan alamat yang didapat
      setForm(prev => ({
        ...prev,
        alamat: formattedAddress || 'Alamat tidak ditemukan'
      }));
      
    } catch (error) {
      console.error('Error getting address:', error);
      
      // Lebih spesifik error handling
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          alert('Koneksi internet bermasalah. Silakan periksa koneksi Anda.');
        } else if (error.message.includes('rate limit') || error.message.includes('403')) {
          alert('Terlalu banyak permintaan. Silakan tunggu beberapa saat dan coba lagi.');
        } else {
          alert('Gagal mendapatkan alamat dari koordinat. Silakan isi alamat secara manual.');
        }
      } else {
        alert('Gagal mendapatkan alamat dari koordinat. Silakan isi alamat secara manual.');
      }
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handler untuk update koordinat dan auto-fill alamat
  const handleCoordinateChange = (newCoord: [number, number]) => {
    console.log('=== COORDINATE CHANGE ===');
    console.log('Old coordinates:', form.coord);
    console.log('New coordinates:', newCoord);
    console.log('========================');
    
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
        console.log('=== CURRENT LOCATION ===');
        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
        console.log('========================');
        
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

  // ...existing submit function...
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
            img_url: publicUrl,
          },
        ])
        .select("id");
      if (!locationRes.data) throw locationRes.error;

      const cleanlinessRes = await supabase
        .from("cleanliness_reports")
        .insert([
          {
            reporter: authRes.data.user?.id,
            location: locationRes.data[0].id,
            score: analysis_result?.skor_kebersihan,
            grade: analysis_result?.grade,
            ai_description: analysis_result?.deskripsi,
          },
        ])
        .select();

      if (cleanlinessRes.error) throw cleanlinessRes.error;
      
      if (cleanlinessRes.data) {
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
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isLoadingAddress}
                className="text-xs"
              >
                {isLoadingAddress ? "Loading..." : "Lokasi Saat Ini"}
              </Button>
            </div>
            <Input
              id="alamat"
              type="text"
              placeholder="Masukkan Alamat"
              required
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={isLoadingAddress}
            />
            {isLoadingAddress && (
              <p className="text-xs text-gray-500 mt-1">Sedang mendapatkan alamat...</p>
            )}
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
