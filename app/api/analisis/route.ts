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
            text: `Analisis gambar ini untuk mengidentifikasi jenis sampah dan berikan edukasi komprehensif.

PENTING: Jika gambar yang dikirim TIDAK BERKAITAN dengan objek sampah/limbah (seperti pemandangan, orang, hewan, kendaraan, dll), maka jawab HANYA:
"Objek bukanlah sampah"

Jika gambar berkaitan dengan sampah/limbah, berikan response dalam format JSON berikut:

{
  "basicAnalysis": {
    "namaObjek": "[nama sampah yang spesifik dan jelas]",
    "kategori": "[organik/anorganik/B3/elektronik]",
    "statusBahaya": "[rendah/sedang/tinggi] - [penjelasan maksimal 10 kata]",
    "waktuTerurai": "[estimasi waktu terurai di alam]",
    "produkReuse": "[1 ide kreatif daur ulang yang praktis]",
    "langkahLangkah": [
      "[langkah pertama yang spesifik]",
      "[langkah kedua yang jelas]", 
      "[langkah ketiga yang detail]",
      "[langkah keempat yang mudah]",
      "[langkah kelima yang praktis]"
    ],
    "nilaiEkonomi": "[harga per kg dalam Rupiah, atau tidak ada nilai jual]"
  },
  "aiEducation": {
    "title": "[judul edukasi yang menarik tentang sampah ini]",
    "description": "[deskripsi singkat 2-3 kalimat]",
    "environmentalImpact": {
      "positive": ["[manfaat positif jika dikelola dengan baik]", "[manfaat lainnya]"],
      "negative": ["[dampak negatif jika tidak dikelola]", "[dampak lainnya]"]
    },
    "tips": {
      "reduce": ["[tip mengurangi sampah jenis ini]", "[tip lainnya]"],
      "reuse": ["[cara menggunakan kembali]", "[cara lainnya]"], 
      "recycle": ["[cara mendaur ulang yang benar]", "[cara lainnya]"]
    },
    "funFacts": ["[fakta menarik 1]", "[fakta menarik 2]", "[fakta menarik 3]"],
    "recyclingProcess": {
      "steps": ["[tahap 1 daur ulang]", "[tahap 2]", "[tahap 3]"],
      "difficulty": "[mudah/sedang/sulit]",
      "timeRequired": "[estimasi waktu yang dibutuhkan]"
    },
    "economicValue": {
      "price": "[harga pasar per kg]",
      "potential": "[potensi ekonomi dari daur ulang]"
    },
    "personalizedAdvice": "[saran personal untuk pengelolaan sampah ini sebagai pemula]"
  }
}

Berikan response dalam format JSON yang valid. Gunakan bahasa Indonesia yang mudah dipahami dan praktis.`,
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
          parsedResponse.basicAnalysis?.wasteType
            ?.toLowerCase()
            .includes("bukan sampah") ||
          parsedResponse.basicAnalysis?.description
            ?.toLowerCase()
            .includes("objek bukanlah sampah") ||
          parsedResponse.basicAnalysis?.description
            ?.toLowerCase()
            .includes("tidak berkaitan dengan sampah");

        if (isNotTrash) {
          return NextResponse.json({
            result:
              parsedResponse.basicAnalysis?.description ||
              "Objek ini bukanlah sampah",
            isNotTrash: true,
          });
        }

        // Return structured response for valid waste analysis
        return NextResponse.json({
          basicAnalysis: parsedResponse.basicAnalysis,
          aiEducation: parsedResponse.aiEducation,
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
