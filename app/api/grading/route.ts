import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs"; // memastikan pakai runtime nodejs

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

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
            text: `Analisis gambar ini untuk grading kebersihan tempat sampah atau area dengan sampah.

PENTING: Jika gambar yang dikirim BUKAN menunjukkan tempat sampah, area kotor, atau tidak berkaitan dengan kebersihan sampah, maka jawab:
"Objek bukanlah sampah yang dapat dinilai untuk grading kebersihan"

Jika gambar menunjukkan tempat sampah atau area yang dapat dinilai kebersihannya, berikan penilaian dengan format berikut:
Skor Kebersihan: [0-100]
Grade: [A/B/C/D] 
Deskripsi: [penjelasan detail kondisi kebersihan]

Jawab langsung sesuai format tanpa pengantar atau markdown.`,
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
      const parsedResult = parseResult(text);
      return NextResponse.json({ result: parsedResult });
    } else {
      return NextResponse.json({ 
        result: {
          skor_kebersihan: null,
          grade: null,
          deskripsi: "AI tidak memberikan response yang valid"
        }
      });
    }
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ 
      result: {
        skor_kebersihan: null,
        grade: null,
        deskripsi: "Terjadi kesalahan saat menganalisis gambar"
      }
    }, { status: 500 });
  }
}

function parseResult(text: string) {
  // Cek jika AI mengatakan gambar bukan untuk grading sampah
  const isNotTrashGrading = text.toLowerCase().includes("tidak berkaitan dengan grading sampah") || 
                           text.toLowerCase().includes("bukan sampah") ||
                           text.toLowerCase().includes("objek bukanlah sampah") ||
                           text.toLowerCase().includes("tidak dapat dinilai");

  if (isNotTrashGrading) {
    return {
      skor_kebersihan: null,
      grade: null,
      deskripsi: "Objek bukanlah sampah yang dapat dinilai untuk grading kebersihan",
    };
  }

  const skorMatch = text.match(/Skor Kebersihan\s*:\s*(\d+)/i);
  const gradeMatch = text.match(/Grade\s*:\s*([A-D])/i);
  const deskripsiMatch = text.match(/Deskripsi\s*:\s*(.*)/i);

  // Jika tidak ada skor dan grade yang valid, kemungkinan bukan grading sampah
  if (!skorMatch && !gradeMatch) {
    return {
      skor_kebersihan: null,
      grade: null,
      deskripsi: text.trim() || "Objek bukanlah sampah yang dapat dinilai untuk grading kebersihan",
    };
  }

  return {
    skor_kebersihan: skorMatch ? parseInt(skorMatch[1]) : null,
    grade: gradeMatch?.[1]?.toUpperCase() || null,
    deskripsi: deskripsiMatch?.[1]?.trim() || "Tidak ada deskripsi tersedia",
  };
}
