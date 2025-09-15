import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        {
          error: "No image provided",
        },
        { status: 400 }
      );
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
        },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use Gemini Pro Vision model for image analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analisis gambar ini untuk mengidentifikasi jenis sampah dan berikan edukasi komprehensif.

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

Berikan response dalam format JSON yang valid. Gunakan bahasa Indonesia yang mudah dipahami dan praktis.`;

    const imagePart = {
      inlineData: {
        data: image,
        mimeType: "image/jpeg",
      },
    };

    console.log("🤖 Sending request to Gemini AI...");

    // Generate content using Gemini AI
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Received response from Gemini AI");

    // Check if AI detected non-trash object
    const isNotTrash =
      text.toLowerCase().includes("objek bukanlah sampah") ||
      text.toLowerCase().includes("bukan sampah") ||
      text.toLowerCase().includes("tidak berkaitan dengan sampah");

    if (isNotTrash) {
      return NextResponse.json({
        result: text,
        isNotTrash: true,
        isDemo: false,
        detectedType: null,
        basicAnalysis: null,
        aiEducation: null,
      });
    }

    // Try to parse JSON response
    let parsedData = null;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.log("Failed to parse JSON, using fallback format");
    }

    if (parsedData && parsedData.basicAnalysis && parsedData.aiEducation) {
      // Successfully parsed combined response
      const detectedType = extractWasteType(
        parsedData.basicAnalysis.namaObjek || ""
      );

      // Create formatted text for backward compatibility
      const formattedText = `Nama objek: ${parsedData.basicAnalysis.namaObjek}
Kategori: ${parsedData.basicAnalysis.kategori}
Status bahaya: ${parsedData.basicAnalysis.statusBahaya}
Waktu terurai: ${parsedData.basicAnalysis.waktuTerurai}
Produk reuse: ${parsedData.basicAnalysis.produkReuse}
Langkah-langkah:
${parsedData.basicAnalysis.langkahLangkah
  .map((step: string, index: number) => `${index + 1}. ${step}`)
  .join("\n")}
Nilai ekonomi: ${parsedData.basicAnalysis.nilaiEkonomi}`;

      return NextResponse.json({
        result: formattedText,
        isNotTrash: false,
        isDemo: false,
        detectedType: detectedType,
        basicAnalysis: parsedData.basicAnalysis,
        aiEducation: {
          ...parsedData.aiEducation,
          generatedAt: new Date().toISOString(),
          wasteType: parsedData.basicAnalysis.namaObjek,
          confidence: 85, // Default confidence since we got structured data
          isfallback: false,
        },
      });
    } else {
      // Fallback to original format if JSON parsing fails
      const detectedType = extractWasteType(text);

      return NextResponse.json({
        result: text,
        isNotTrash: false,
        isDemo: false,
        detectedType: detectedType,
        basicAnalysis: null,
        aiEducation: null,
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

// Helper function to extract waste type from AI response
function extractWasteType(text: string): string | null {
  const lowercaseText = text.toLowerCase();

  // Map AI response to our waste education database
  if (
    lowercaseText.includes("botol") &&
    (lowercaseText.includes("plastik") || lowercaseText.includes("pet"))
  ) {
    return "botol_plastik";
  } else if (
    lowercaseText.includes("botol") &&
    lowercaseText.includes("kaca")
  ) {
    return "botol_kaca";
  } else if (
    lowercaseText.includes("kaleng") ||
    lowercaseText.includes("aluminium")
  ) {
    return "kaleng_aluminium";
  } else if (
    lowercaseText.includes("kantong") &&
    lowercaseText.includes("plastik")
  ) {
    return "kantong_plastik";
  } else if (
    lowercaseText.includes("styrofoam") ||
    lowercaseText.includes("polystyrene")
  ) {
    return "styrofoam";
  } else if (
    lowercaseText.includes("kertas") ||
    lowercaseText.includes("kardus")
  ) {
    return "kertas";
  } else if (
    lowercaseText.includes("organik") ||
    lowercaseText.includes("makanan") ||
    lowercaseText.includes("buah")
  ) {
    return "sampah_organik";
  }

  // Default fallback based on category
  if (lowercaseText.includes("plastik")) {
    return "botol_plastik";
  } else if (
    lowercaseText.includes("logam") ||
    lowercaseText.includes("metal")
  ) {
    return "kaleng_aluminium";
  } else if (lowercaseText.includes("organik")) {
    return "sampah_organik";
  }

  // If no specific match, return null to let frontend detection handle it
  return null;
}

/*
// 🚀 Real AI Implementation Template
// Uncomment and modify when you want to use actual AI services

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Option 1: Google Gemini Vision
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      
      const prompt = `Analisis gambar ini untuk mengidentifikasi jenis sampah.
      
      Jika bukan sampah, jawab: "Objek bukanlah sampah"
      
      Jika adalah sampah, berikan analisis dengan format:
      - Nama objek: [nama sampah]
      - Kategori: [organik/anorganik/B3]
      - Status bahaya: [tingkat bahaya]
      - Waktu terurai: [estimasi waktu]
      - Cara daur ulang: [metode recycling]
      - Nilai ekonomi: [harga per kg jika ada]`;
      
      const imagePart = {
        inlineData: {
          data: image,
          mimeType: "image/jpeg",
        },
      };
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      const isNotTrash = text.toLowerCase().includes("objek bukanlah sampah");
      
      return NextResponse.json({ 
        result: text,
        isNotTrash: isNotTrash
      });
    }

    // Option 2: OpenAI GPT-4 Vision
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analisis gambar ini untuk mengidentifikasi jenis sampah dan berikan informasi lengkap tentang daur ulang dan dampak lingkungannya."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      });
      
      const data = await response.json();
      const text = data.choices[0].message.content;
      
      return NextResponse.json({ 
        result: text,
        isNotTrash: text.toLowerCase().includes("bukan sampah")
      });
    }

    // Fallback to dummy response if no AI service available
    return dummyResponse();

  } catch (err) {
    console.error("AI API Error:", err);
    return NextResponse.json({ 
      result: "Terjadi kesalahan saat menganalisis gambar",
      isNotTrash: false
    }, { status: 500 });
  }
}
*/
