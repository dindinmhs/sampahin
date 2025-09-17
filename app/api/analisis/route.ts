import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs"; // pastikan pakai runtime node

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // image: base64 string (tanpa prefix data:image/jpeg;base64,)
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const config = {
      responseMimeType: "text/plain",
    };
    const model = "gemma-3-4b-it";
    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: image, // base64 string
              mimeType: "image/jpeg",
            },
          },
          {
            text: `Analisis gambar ini untuk mengidentifikasi jenis sampah.

PENTING: Jika gambar yang dikirim TIDAK BERKAITAN dengan objek sampah/limbah (seperti pemandangan, orang, hewan, kendaraan, dll), maka jawab HANYA:
"Objek bukanlah sampah"

Jika gambar berkaitan dengan sampah/limbah, berikan response dalam format JSON berikut:

{
  "basicAnalysis": {
    "namaObjek": "[nama sampah yang spesifik dan jelas]",
    "kategori": "[organik/anorganik/B3/elektronik]",
    "statusBahaya": "[rendah/sedang/tinggi] - [penjelasan maksimal 10 kata]"
  },
  "kreatiArticles": [
    {
      "id": 1,
      "title": "[Judul artikel kreasi DIY yang menarik]",
      "description": "[Deskripsi singkat 1-2 kalimat tentang kreasi ini]",
      "difficulty": "[mudah/sedang/sulit]",
      "timeRequired": "[estimasi waktu pengerjaan]",
      "materials": ["[bahan 1]", "[bahan 2]", "[bahan 3]"],
      "tools": ["[alat 1]", "[alat 2]"],
      "steps": [
        "[langkah detail 1]",
        "[langkah detail 2]",
        "[langkah detail 3]",
        "[langkah detail 4]",
        "[langkah detail 5]"
      ],
      "tips": ["[tip berguna 1]", "[tip berguna 2]"],
      "finalResult": "[deskripsi hasil akhir yang akan didapat]",
      "benefits": ["[manfaat 1]", "[manfaat 2]"]
    },
    {
      "id": 2,
      "title": "[Judul artikel kreasi DIY kedua]",
      "description": "[Deskripsi singkat kreasi kedua]",
      "difficulty": "[mudah/sedang/sulit]",
      "timeRequired": "[estimasi waktu]",
      "materials": ["[bahan 1]", "[bahan 2]", "[bahan 3]"],
      "tools": ["[alat 1]", "[alat 2]"],
      "steps": [
        "[langkah 1]", "[langkah 2]", "[langkah 3]", "[langkah 4]", "[langkah 5]"
      ],
      "tips": ["[tip 1]", "[tip 2]"],
      "finalResult": "[hasil akhir]",
      "benefits": ["[manfaat 1]", "[manfaat 2]"]
    },
    {
      "id": 3,
      "title": "[Judul artikel kreasi DIY ketiga]",
      "description": "[Deskripsi singkat kreasi ketiga]",
      "difficulty": "[mudah/sedang/sulit]",
      "timeRequired": "[estimasi waktu]",
      "materials": ["[bahan 1]", "[bahan 2]", "[bahan 3]"],
      "tools": ["[alat 1]", "[alat 2]"],
      "steps": [
        "[langkah 1]", "[langkah 2]", "[langkah 3]", "[langkah 4]", "[langkah 5]"
      ],
      "tips": ["[tip 1]", "[tip 2]"],
      "finalResult": "[hasil akhir]",
      "benefits": ["[manfaat 1]", "[manfaat 2]"]
    },
    {
      "id": 4,
      "title": "[Judul artikel kreasi DIY keempat]",
      "description": "[Deskripsi singkat kreasi keempat]",
      "difficulty": "[mudah/sedang/sulit]",
      "timeRequired": "[estimasi waktu]",
      "materials": ["[bahan 1]", "[bahan 2]", "[bahan 3]"],
      "tools": ["[alat 1]", "[alat 2]"],
      "steps": [
        "[langkah 1]", "[langkah 2]", "[langkah 3]", "[langkah 4]", "[langkah 5]"
      ],
      "tips": ["[tip 1]", "[tip 2]"],
      "finalResult": "[hasil akhir]",
      "benefits": ["[manfaat 1]", "[manfaat 2]"]
    },
    {
      "id": 5,
      "title": "[Judul artikel kreasi DIY kelima]",
      "description": "[Deskripsi singkat kreasi kelima]",
      "difficulty": "[mudah/sedang/sulit]",
      "timeRequired": "[estimasi waktu]",
      "materials": ["[bahan 1]", "[bahan 2]", "[bahan 3]"],
      "tools": ["[alat 1]", "[alat 2]"],
      "steps": [
        "[langkah 1]", "[langkah 2]", "[langkah 3]", "[langkah 4]", "[langkah 5]"
      ],
      "tips": ["[tip 1]", "[tip 2]"],
      "finalResult": "[hasil akhir]",
      "benefits": ["[manfaat 1]", "[manfaat 2]"]
    }
  ]
}

WAJIB generate MINIMAL 5 artikel kreasi yang berbeda-beda! Berikan response dalam format JSON yang valid. Gunakan bahasa Indonesia yang mudah dipahami dan praktis.`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    if (response.text) {
      const text = response.text;

      try {
        // Parse JSON response from AI
        const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsedResponse = JSON.parse(cleanedText);

        // Cek jika AI mengatakan objek bukan sampah
        const isNotTrash = 
          cleanedText.toLowerCase().includes("objek bukanlah sampah") ||
          !parsedResponse.basicAnalysis ||
          !parsedResponse.kreatiArticles;

        if (isNotTrash) {
          return NextResponse.json({
            result: "Objek ini bukanlah sampah",
            isNotTrash: true,
          });
        }

        // Return structured response for valid waste analysis
        return NextResponse.json({
          basicAnalysis: parsedResponse.basicAnalysis,
          kreatiArticles: parsedResponse.kreatiArticles,
          isNotTrash: false,
        });
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        console.error("Raw response:", text);

        // Fallback: return simple text response if JSON parsing fails
        const isNotTrash =
          text.toLowerCase().includes("objek bukanlah sampah") ||
          text.toLowerCase().includes("bukan sampah") ||
          text.toLowerCase().includes("tidak berkaitan dengan sampah");

        return NextResponse.json({
          result: text,
          isNotTrash: isNotTrash,
        });
      }
    } else {
      return NextResponse.json({
        result: "AI tidak memberikan response yang valid",
        isNotTrash: false,
      });
    }
  } catch (err) {
    console.error("Gemini AI Error:", err);

    // Provide specific error messages
    let errorMessage = "Terjadi kesalahan saat menganalisis gambar.";

    if (err instanceof Error) {
      if (err.message.includes("API_KEY")) {
        errorMessage =
          "API key Gemini tidak valid. Silakan periksa konfigurasi.";
      } else if (err.message.includes("quota")) {
        errorMessage = "Kuota API Gemini habis. Silakan coba lagi nanti.";
      } else if (err.message.includes("network")) {
        errorMessage =
          "Gagal terhubung ke layanan AI. Periksa koneksi internet.";
      } else if (
        err.message.includes("size") ||
        err.message.includes("large")
      ) {
        errorMessage =
          "Ukuran gambar terlalu besar. Silakan gunakan gambar yang lebih kecil.";
      } else {
        errorMessage = `Error AI: ${err.message}`;
      }
    }

    return NextResponse.json(
      {
        result: errorMessage,
        isNotTrash: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
