"use client"

import { Button } from "@/components/ui/button"
import { useState, useRef, Dispatch, SetStateAction } from "react"
import { Camera, Upload, X } from "lucide-react"
import Image from "next/image"
import { DragCloseDrawer } from "../common/modal"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export const GradingForm = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [open, setOpen] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<{
    skor_kebersihan: number | null
    grade: string | null
    deskripsi: string | null
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setAnalysisResult(null)
    }
  }

  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setIsCapturing(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      let errorMessage = 'Tidak dapat mengakses kamera. '

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Izin kamera ditolak. Silakan izinkan akses kamera di browser.'
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'Kamera tidak ditemukan pada perangkat ini.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Browser tidak mendukung akses kamera.'
        } else {
          errorMessage += `Error: ${error.message}`
        }
      }

      setCameraError(errorMessage)
      setIsCapturing(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
            setSelectedImage(file)
            setPreviewUrl(URL.createObjectURL(file))
            setAnalysisResult(null)
            stopCamera()
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
    setCameraError(null)
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setAnalysisResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalysis = async () => {
    if (!selectedImage) {
      alert('Silakan pilih gambar terlebih dahulu')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1]
            resolve(base64)
          }
          reader.onerror = (error) => reject(error)
        })

      const base64Image = await toBase64(selectedImage)

      const res = await fetch("/api/grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.result) {
        setAnalysisResult(data.result)
      } else {
        setAnalysisResult({
          skor_kebersihan: null,
          grade: null,
          deskripsi: 'Gagal menganalisis gambar.',
        })
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setAnalysisResult({
        skor_kebersihan: null,
        grade: null,
        deskripsi: 'Terjadi kesalahan saat analisis. Silakan coba lagi.',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Upload Tempat Kotor
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
                variant="outline"
                onClick={stopCamera}
              >
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
            {selectedImage?.name || 'Foto dari kamera'}
          </p>
        </div>
      )}

      {/* Analysis Button */}
      <div className="text-center">
        {/* Analysis Result */}
        {analysisResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">Hasil Analisis:</h3>
            <p><span className="font-medium">Skor Kebersihan:</span> {analysisResult.skor_kebersihan ?? 'Tidak tersedia'}</p>
            <p><span className="font-medium">Grade:</span> {analysisResult.grade ?? 'Tidak tersedia'}</p>
            <p><span className="font-medium">Deskripsi:</span> {analysisResult.deskripsi ?? 'Tidak tersedia'}</p>
          </div>
        )}
        {analysisResult?
        <Button
          onClick={()=>setOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-2 text-lg w-full"
        >
          Bagikan
        </Button>
        :<Button
          onClick={handleAnalysis}
          disabled={!selectedImage || isAnalyzing}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-2 text-lg w-full"
        >
          {isAnalyzing ? "Menganalisis..." : "Analisis"}
        </Button>}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
      <GradeShareForm open={open} setOpen={setOpen}/>
    </div>
  )
}

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const GradeShareForm = ({open, setOpen}:Props) => {
  return (
    <DragCloseDrawer open={open} setOpen={setOpen}>
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-4">
                <div>
                    <Label htmlFor="nama" className="text-sm font-medium text-gray-700">
                    Nama
                    </Label>
                    <Input
                    id="nama"
                    type="text"
                    placeholder="Masukkan Nama"
                    required
                    //   value={email}
                    //   onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div>
                    <Label htmlFor="alamat" className="text-sm font-medium text-gray-700">
                    Alamat
                    </Label>
                    <Input
                    id="alamat"
                    type="text"
                    placeholder="Masukkan Alamat"
                    required
                    //   value={email}
                    //   onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
            </div>
        </div>
    </DragCloseDrawer>
  )
}

