import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { titles } = await request.json();

    if (!titles || !Array.isArray(titles)) {
      return NextResponse.json(
        { error: "Invalid input: titles array required" },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error("Gemini API Key not found");
      // Return dummy success for development/testing
      console.log("Development mode: returning mock image URLs");
      const mockImages = titles.map((title, index) => ({
        title,
        imageUrl: `https://via.placeholder.com/512x512/10b981/white?text=DIY+${index + 1}`,
        success: true
      }));
      
      return NextResponse.json({
        images: mockImages,
        summary: {
          total: titles.length,
          successful: titles.length,
          failed: 0
        }
      });
    }

    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    const config = {
      responseModalities: [
        'IMAGE',
        'TEXT',
      ],
    };

    const model = 'gemini-2.5-flash-image-preview';

    // Optimized: Generate all images in a single batch request to save tokens
    console.log(`Starting batch generation of ${titles.length} images...`);
    const startTime = Date.now();
    
    // Create a single comprehensive prompt for all images
    const batchImagePrompt = `Buatkan ${titles.length} gambar yang realistis dan menarik untuk proyek-proyek kerajinan DIY berikut:

${titles.map((title, index) => `${index + 1}. "${title}"`).join('\n')}

PENTING: Generate tepat ${titles.length} gambar yang sesuai dengan urutan judul di atas.
Setiap gambar harus:
- Menampilkan hasil akhir yang dibuat dari bahan daur ulang
- Lingkungan yang bersih, terang, dan modern
- Gaya fotografi produk profesional
- Menginspirasi kreativitas dalam mengubah sampah menjadi barang berguna dan indah
- Pencahayaan yang baik dan menarik

Gaya: clean, modern, well-lit, professional product photography style.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: batchImagePrompt,
          },
        ],
      },
    ];

    // Single attempt with extended timeout - no retries as per user request
    const maxRetries = 1;
    let lastError: Error | null = null;
    let processedResults: { title: string; imageUrl: string | null; success: boolean; error?: string }[] = [];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🍌 Batch generation attempt ${attempt}/${maxRetries} (extended timeout)...`);
        
        // Create a promise with extended timeout for the entire generation process
        const generationPromise = new Promise<{ generatedImages: string[]; hasContent: boolean }>(async (resolve, reject) => {
          try {
            const response = await ai.models.generateContentStream({
              model,
              config,
              contents,
            });

            const generatedImages: string[] = [];
            let hasContent = false;

            for await (const chunk of response) {
              if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                continue;
              }
              
              hasContent = true;
              const parts = chunk.candidates[0].content.parts;
              
              for (const part of parts) {
                if (part.inlineData) {
                  const { data, mimeType } = part.inlineData;
                  if (data) {
                    const dataUrl = `data:${mimeType || 'image/png'};base64,${data}`;
                    generatedImages.push(dataUrl);
                    console.log(`🖼️ Received image ${generatedImages.length}/${titles.length}`);
                  }
                }
              }
            }

            resolve({ generatedImages, hasContent });
          } catch (error) {
            reject(error);
          }
        });

        // Set extended timeout - 3 minutes instead of default
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Batch generation timeout after 3 minutes'));
          }, 180000); // 3 minutes
        });

        console.log(`⏳ Waiting for batch generation with 3-minute timeout...`);
        const result = await Promise.race([generationPromise, timeoutPromise]);

        if (!result.hasContent) {
          throw new Error('No response content received from batch generation');
        }

        // Map results to titles
        processedResults = titles.map((title, index) => {
          if (index < result.generatedImages.length) {
            console.log(`✅ Successfully generated image for: ${title}`);
            return {
              title,
              imageUrl: result.generatedImages[index],
              success: true
            };
          } else {
            console.log(`⚠️ No image generated for: ${title}`);
            return {
              title,
              imageUrl: null,
              success: false,
              error: `Image ${index + 1} not generated in batch response`
            };
          }
        });
        
        console.log(`🎉 Batch generation completed: ${result.generatedImages.length}/${titles.length} images`);
        break; // Success, exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Batch attempt ${attempt} failed:`, error);
        
        // For INTERNAL errors, provide specific error message
        if (error instanceof Error && error.message.includes('INTERNAL')) {
          console.error(`🔥 Google AI Internal Server Error - this is a temporary issue on Google's side`);
          lastError = new Error(`Google AI Internal Server Error: ${error.message}`);
        }
        
        // No retry - single attempt only as requested
        break;
      }
    }
    
    // If batch attempt failed, return error results with specific messaging
    if (processedResults.length === 0) {
      console.error(`❌ Batch generation failed:`, lastError);
      
      let errorMessage = 'Batch image generation failed';
      if (lastError?.message.includes('INTERNAL')) {
        errorMessage = 'Google AI mengalami gangguan internal (Error 500). Ini adalah masalah sementara dari Google AI.';
      } else if (lastError?.message.includes('timeout')) {
        errorMessage = 'Timeout - generasi gambar membutuhkan waktu lebih dari 3 menit';
      } else if (lastError?.message.includes('quota')) {
        errorMessage = 'Kuota API habis - silakan coba lagi nanti';
      }
      
      processedResults = titles.map(title => ({
        title,
        imageUrl: null,
        success: false,
        error: errorMessage
      }));
    }

    const endTime = Date.now();
    console.log(`⏱️ Total batch generation time: ${(endTime - startTime) / 1000}s`);
    console.log("🍌 Gemini batch image generation results:", processedResults.map(r => ({ 
      title: r.title, 
      success: r.success, 
      error: r.error || 'N/A' 
    })));

    const successfulImages = processedResults.filter(r => r.success);
    const failedImages = processedResults.filter(r => !r.success);

    console.log(`Single attempt - Successful: ${successfulImages.length}, Failed: ${failedImages.length}`);

    return NextResponse.json({
      images: processedResults,
      summary: {
        total: titles.length,
        successful: successfulImages.length,
        failed: failedImages.length,
        method: 'single-batch-generation', // Indicate this used single attempt batch method
        timeout: '3-minutes'
      }
    });

  } catch (error) {
    console.error("❌ Gemini image generation error:", error);
    
    let errorMessage = "Failed to generate images with Gemini";
    if (error instanceof Error) {
      if (error.message.includes('INTERNAL')) {
        errorMessage = "Google AI mengalami gangguan internal. Silakan coba lagi dalam beberapa menit.";
      } else if (error.message.includes('quota')) {
        errorMessage = "Kuota API Gemini habis. Silakan coba lagi nanti.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timeout - silakan coba lagi dengan gambar yang lebih sederhana.";
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: "Jika error INTERNAL terus terjadi, ini adalah masalah sementara dari Google AI. Silakan coba lagi nanti."
      },
      { status: 500 }
    );
  }
}