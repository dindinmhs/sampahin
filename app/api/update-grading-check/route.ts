import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleAuth } from 'google-auth-library';
import { GoogleGenAI } from '@google/genai';

interface UpdateGradingCheckResult {
  report_id: string;
  location_id: string;
  location_name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  grade: string;
  score: number;
  ai_description: string;
  img_url: string;
  image_similarity: number;
  can_update: boolean;
}

interface GradingResult {
  skor_kebersihan: number;
  grade: string;
  deskripsi: string;
}


// Generate image embedding
async function generateImageEmbedding(imageBase64: string): Promise<number[] | null> {
  try {
    // Setup Google Auth
    let auth;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      });
    } else {
      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    }

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = 'us-central1';
    const model = 'multimodalembedding@001';

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

    const requestBody = {
      instances: [
        {
          text: "Analisis kondisi kebersihan lokasi dari gambar",
          image: {
            bytesBase64Encoded: imageBase64
          }
        }
      ],
      parameters: {
        dimension: 512
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI API error:', errorText);
      throw new Error(`Vertex AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.predictions?.[0]?.imageEmbedding || null;

  } catch (error) {
    console.error('Error generating image embedding:', error);
    return null;
  }
}

// Check image similarity with previous reports
async function checkImageSimilarity(
  imageEmbedding: number[],
  locationId: string,
  similarityThreshold: number = 0.6
): Promise<UpdateGradingCheckResult | null> {
  const supabase = createClient();
  console.log(locationId)

  try {
    const { data, error } = await (await supabase).rpc('check_image_similarity_for_location', {
      query_image_embedding: imageEmbedding,
      target_location_id: locationId
    });

    if (error) {
      console.error('Image similarity check error:', error);
      return null;
    }

    const result = data?.[0];
    if (!result) {
      return null;
    }

    // API yang menentukan can_update berdasarkan threshold
    const canUpdate = result.image_similarity >= similarityThreshold;

    return {
      ...result,
      can_update: canUpdate
    };
  } catch (error) {
    console.error('Error in image similarity check:', error);
    return null;
  }
}

async function performGrading(imageBase64: string): Promise<GradingResult | null> {
  try {
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
              data: imageBase64, // base64 string
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
      const parsedResult = parseGradingResult(text);
      return parsedResult;
    } else {
      return {
        skor_kebersihan: 0,
        grade: "E",
        deskripsi: "AI tidak memberikan response yang valid"
      };
    }
  } catch (error) {
    console.error('Error in grading analysis:', error);
    return null;
  }
}

// Parse grading result from AI response
function parseGradingResult(text: string): GradingResult {
  // Cek jika AI mengatakan gambar bukan untuk grading sampah
  const isNotTrashGrading = text.toLowerCase().includes("tidak berkaitan dengan grading sampah") || 
                           text.toLowerCase().includes("bukan sampah") ||
                           text.toLowerCase().includes("objek bukanlah sampah") ||
                           text.toLowerCase().includes("tidak dapat dinilai");

  if (isNotTrashGrading) {
    return {
      skor_kebersihan: 0,
      grade: "E",
      deskripsi: "Objek bukanlah sampah yang dapat dinilai untuk grading kebersihan",
    };
  }

  const skorMatch = text.match(/Skor Kebersihan\s*:\s*(\d+)/i);
  const gradeMatch = text.match(/Grade\s*:\s*([A-D])/i);
  const deskripsiMatch = text.match(/Deskripsi\s*:\s*(.*)/i);

  // Jika tidak ada skor dan grade yang valid, kemungkinan bukan grading sampah
  if (!skorMatch && !gradeMatch) {
    return {
      skor_kebersihan: 0,
      grade: "E",
      deskripsi: text.trim() || "Objek bukanlah sampah yang dapat dinilai untuk grading kebersihan",
    };
  }

  return {
    skor_kebersihan: skorMatch ? parseInt(skorMatch[1]) : 0,
    grade: gradeMatch?.[1]?.toUpperCase() || "E",
    deskripsi: deskripsiMatch?.[1]?.trim() || "Tidak ada deskripsi tersedia",
  };
}

export async function POST(request: NextRequest) {
  try {
    const { image, locationId, similarityThreshold = 0.6 } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    console.log('=== UPDATE GRADING CHECK PROCESS ===');
    console.log('Location ID:', locationId);
    console.log('Similarity Threshold:', similarityThreshold);

    // Step 1: Perform grading analysis
    console.log('Step 1: Performing grading analysis...');
    const gradingResult = await performGrading(image);
    
    if (!gradingResult) {
      return NextResponse.json(
        { error: 'Failed to perform grading analysis' },
        { status: 500 }
      );
    }

    console.log('Grading Result:', {
      grade: gradingResult.grade,
      score: gradingResult.skor_kebersihan
    });

    // Step 2: Check if grade meets minimum requirement (B or better)
    const isValidGrade = gradingResult.grade === "A" || gradingResult.grade === "B";
    
    if (!isValidGrade) {
      console.log('Grade not sufficient for sharing:', gradingResult.grade);
      return NextResponse.json({
        grading: gradingResult,
        similarity: null,
        canShare: false,
        reason: 'grade_insufficient'
      });
    }

    // Step 3: Generate image embedding
    console.log('Step 2: Generating image embedding...');
    const imageEmbedding = await generateImageEmbedding(image);
    
    if (!imageEmbedding) {
      console.log('Failed to generate image embedding, allowing share for valid grade');
      return NextResponse.json({
        grading: gradingResult,
        similarity: null,
        canShare: true,
        reason: 'no_embedding_first_report'
      });
    }

    console.log('Image embedding generated, length:', imageEmbedding.length);

    // Step 4: Check image similarity with previous reports
    console.log('Step 3: Checking image similarity...');
    const similarityResult = await checkImageSimilarity(
      imageEmbedding, 
      locationId, 
      similarityThreshold
    );

    if (!similarityResult) {
      console.log('No previous report found, allowing share for valid grade');
      return NextResponse.json({
        grading: gradingResult,
        similarity: null,
        canShare: true,
        reason: 'no_previous_report'
      });
    }

    console.log('Similarity Result:', {
      previous_grade: similarityResult.grade,
      previous_score: similarityResult.score,
      image_similarity: (similarityResult.image_similarity * 100).toFixed(2) + '%',
      can_update: similarityResult.can_update
    });

    // Step 5: Determine if sharing is allowed
    const canShare = isValidGrade && similarityResult.can_update;
    const reason = canShare 
      ? 'valid' 
      : !isValidGrade 
        ? 'grade_insufficient' 
        : 'similarity_too_low';

    console.log('Final Decision:', {
      canShare,
      reason,
      grade_valid: isValidGrade,
      similarity_valid: similarityResult.can_update
    });
    console.log('=====================================');

    return NextResponse.json({
      grading: gradingResult,
      similarity: similarityResult,
      canShare,
      reason
    });

  } catch (error) {
    console.error('Update grading check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check update grading eligibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}