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
            text: `grading tempat ini dengan template jawaban berikut.
Skor Kebersihan : 0-100,
Grade : (A-D),
Deskripsi : (detail kondisi),
tolong jawab langsung ke templatenya saja tidak perlu pakai pengantar jangan format markdown`,
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
    }
  } catch (err) {
    return NextResponse.json({ error: err?.toString() }, { status: 500 });
  }
}

function parseResult(text: string) {
  const skorMatch = text.match(/Skor Kebersihan\s*:\s*(\d+)/i);
  const gradeMatch = text.match(/Grade\s*:\s*([A-D])/i);
  const deskripsiMatch = text.match(/Deskripsi\s*:\s*(.*)/i);

  return {
    skor_kebersihan: skorMatch ? parseInt(skorMatch[1]) : null,
    grade: gradeMatch?.[1]?.toUpperCase() || null,
    deskripsi: deskripsiMatch?.[1]?.trim() || null,
  };
}
