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
            text: `Analisis gambar ini untuk objek berupa sampah atau bukan.

PENTING: Jika gambar yang dikirim TIDAK BERKAITAN dengan objek sampah, maka jawab:
"Objek bukanlah sampah"

Jika gambar berkaitan dengan sampah, berikan penilaian dengan format berikut:
nama objek
kategori : (organik/anorganik/b3)
status bahaya :
produk reuse : (ide produk daur ulang (reuse) salah satu saja)
langkah-langkah : (langkah-langkah detail untuk mengolahnya kembali menjadi barang yang berguna dalam bentuk list)
tolong jawab langsung dari nama objeksaja jangan format markdown`,
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
      
      // Cek jika AI mengatakan objek bukan sampah
      const isNotTrash = text.toLowerCase().includes("objek bukanlah sampah") || 
                        text.toLowerCase().includes("bukan sampah") ||
                        text.toLowerCase().includes("tidak berkaitan dengan sampah");

      return NextResponse.json({ 
        result: text,
        isNotTrash: isNotTrash
      });
    } else {
      return NextResponse.json({ 
        result: "AI tidak memberikan response yang valid",
        isNotTrash: false
      });
    }
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ 
      result: "Terjadi kesalahan saat menganalisis gambar",
      isNotTrash: false
    }, { status: 500 });
  }
}