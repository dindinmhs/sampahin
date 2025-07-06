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
            text: `grading tempat ini dengan template jawaban berikut.
Skor Kebersihan : 0-100
Grade : (A-D)
Deskripsi : (detail kondisi)
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

    return NextResponse.json({ result : response.text });
  } catch (err) {
    return NextResponse.json({ error: err?.toString() }, { status: 500 });
  }
}