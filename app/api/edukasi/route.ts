import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  let wasteType: string = "";
  let detectionConfidence: number = 0;
  let userLevel: string = "beginner";

  try {
    const body = await request.json();
    wasteType = body.wasteType;
    detectionConfidence = body.detectionConfidence;
    userLevel = body.userLevel || "beginner";

    if (!wasteType) {
      return NextResponse.json(
        { error: "Jenis sampah harus disediakan" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Kamu adalah seorang ahli lingkungan dan edukator sampah yang berpengalaman. Berikan edukasi komprehensif tentang ${wasteType} dengan format JSON berikut:

{
  "title": "Judul edukasi yang menarik",
  "description": "Deskripsi singkat 2-3 kalimat",
  "environmentalImpact": {
    "positive": ["manfaat positif jika dikelola dengan baik"],
    "negative": ["dampak negatif jika tidak dikelola dengan baik"]
  },
  "recyclingProcess": {
    "steps": ["langkah-langkah daur ulang"],
    "difficulty": "mudah/sedang/sulit",
    "timeRequired": "estimasi waktu"
  },
  "tips": {
    "reduce": ["tips mengurangi sampah jenis ini"],
    "reuse": ["cara menggunakan kembali"],
    "recycle": ["cara mendaur ulang yang benar"]
  },
  "funFacts": ["fakta menarik tentang sampah ini"],
  "economicValue": {
    "price": "harga per kg jika dijual",
    "potential": "potensi ekonomi"
  },
  "personalizedAdvice": "saran personal berdasarkan tingkat ${userLevel}"
}

Pastikan informasi akurat, mudah dipahami, dan sesuai dengan kondisi Indonesia. Berikan respons dalam bahasa Indonesia yang natural dan educatif.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI tidak menghasilkan format JSON yang valid");
    }

    const educationData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: {
        ...educationData,
        generatedAt: new Date().toISOString(),
        wasteType,
        confidence: detectionConfidence,
      },
    });
  } catch (error) {
    console.error("Error generating AI education:", error);

    // Fallback education data
    const fallbackData = {
      title: `Edukasi Dasar ${wasteType || "Sampah"}`,
      description:
        "Mohon maaf, terjadi kendala dalam menghasilkan konten edukasi AI. Berikut informasi dasar tentang pengelolaan sampah ini.",
      environmentalImpact: {
        positive: ["Dapat didaur ulang menjadi produk bermanfaat"],
        negative: [
          "Dapat mencemari lingkungan jika tidak dikelola dengan baik",
        ],
      },
      recyclingProcess: {
        steps: [
          "Pisahkan dari sampah lain",
          "Bersihkan dari kotoran",
          "Serahkan ke tempat daur ulang",
        ],
        difficulty: "sedang",
        timeRequired: "5-10 menit",
      },
      tips: {
        reduce: ["Kurangi penggunaan produk sekali pakai"],
        reuse: ["Gunakan kembali jika masih layak"],
        recycle: ["Daur ulang sesuai jenisnya"],
      },
      funFacts: ["Setiap jenis sampah memiliki cara pengelolaan yang berbeda"],
      economicValue: {
        price: "Bervariasi tergantung jenis",
        potential: "Dapat memberikan nilai ekonomi jika dikelola dengan baik",
      },
      personalizedAdvice:
        "Mulai dengan memisahkan sampah di rumah sebagai langkah awal",
    };

    return NextResponse.json({
      success: true,
      data: {
        ...fallbackData,
        generatedAt: new Date().toISOString(),
        wasteType: wasteType || "unknown",
        confidence: detectionConfidence || 0,
        isfallback: true,
      },
    });
  }
}
