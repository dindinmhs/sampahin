import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleAuth } from 'google-auth-library';

interface RAGResult {
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
  lan: number;
  lat: number;
  img_url: string;
  type: string;
  similarity_score: number;
  text_similarity?: number;
  image_similarity?: number;
}

interface EmbeddingResult {
  textEmbedding: number[] | null;
  imageEmbedding: number[] | null;
}

// Fungsi untuk generate embedding
async function generateEmbedding(text: string, imageBase64?: string): Promise<EmbeddingResult> {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = 'us-central1';
    const model = 'multimodalembedding@001';

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

    const requestBody = {
      instances: [
        {
          text: text,
          ...(imageBase64 && {
            image: {
              bytesBase64Encoded: imageBase64
            }
          })
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
      throw new Error(`Vertex AI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      textEmbedding: data.predictions?.[0]?.textEmbedding || null,
      imageEmbedding: data.predictions?.[0]?.imageEmbedding || null
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    return {
      textEmbedding: null,
      imageEmbedding: null
    };
  }
}

// Fungsi untuk RAG search dengan mode berbeda
async function searchRAG(
  textEmbedding: number[] | null,
  imageEmbedding: number[] | null,
  searchMode: 'text' | 'image' | 'multimodal',
  limit: number = 5
): Promise<RAGResult[]> {
  const supabase = createClient();

  try {
    console.log(`Calling search_similar_reports with mode: ${searchMode}`);
    
    const { data, error } = await (await supabase).rpc('search_similar_reports', {
      query_text_embedding: textEmbedding,
      query_image_embedding: imageEmbedding,
      similarity_threshold: 0.3,
      match_limit: limit,
      search_mode: searchMode
    });

    if (error) {
      console.error('RAG search error:', error);
      return [];
    }

    console.log(`RAG search successful, results: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    console.error('RAG search exception:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const query = formData.get('query') as string;
    const imageFile = formData.get('image') as File | null;

    if (!query.trim() && !imageFile) {
      return NextResponse.json(
        { error: 'Query or image is required' },
        { status: 400 }
      );
    }

    // Convert image to base64 if provided
    let imageBase64: string | undefined;
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageBase64 = buffer.toString('base64');
    }

    // Determine search mode
    let searchMode: 'text' | 'image' | 'multimodal';
    if (query.trim() && imageFile) {
      searchMode = 'multimodal';
    } else if (imageFile && !query.trim()) {
      // If only image, use generic description
      query || 'Analisis kondisi kebersihan dari gambar';
      searchMode = 'multimodal'; // Still need text context for image
    } else {
      searchMode = 'text';
    }

    console.log('=== CHATBOT RAG PROCESS ===');
    console.log('Query:', query);
    console.log('Has Image:', !!imageFile);
    console.log('Search Mode:', searchMode);
    
    // Generate embedding
    const { textEmbedding, imageEmbedding } = await generateEmbedding(
      query || 'Kondisi kebersihan lokasi',
      imageBase64
    );
    
    if (!textEmbedding && !imageEmbedding) {
      console.log('Failed to generate any embedding');
      return NextResponse.json(
        { error: 'Failed to generate embedding' },
        { status: 500 }
      );
    }

    console.log('Embeddings generated:');
    console.log('- Text embedding length:', textEmbedding?.length || 'N/A');
    console.log('- Image embedding length:', imageEmbedding?.length || 'N/A');

    // Perform RAG search
    console.log('Performing RAG search...');
    const ragResults = await searchRAG(textEmbedding, imageEmbedding, searchMode, 5);
    
    console.log('=== RAG RESULTS ===');
    console.log('Total Results:', ragResults.length);
    console.log('Search Mode:', searchMode);
    ragResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`, {
        location: result.location_name,
        grade: result.grade,
        score: result.score,
        type: result.type,
        overall_similarity: (result.similarity_score * 100).toFixed(2) + '%',
        text_similarity: result.text_similarity ? (result.text_similarity * 100).toFixed(2) + '%' : 'N/A',
        image_similarity: result.image_similarity ? (result.image_similarity * 100).toFixed(2) + '%' : 'N/A',
        coordinates: [result.lan, result.lat]
      });
    });
    console.log('==================');

    // Generate AI response based on RAG results and search mode
    let aiResponse = "";
    if (ragResults.length > 0) {
      const topResult = ragResults[0];
      
      let modeDescription = "";
      switch (searchMode) {
        case 'text':
          modeDescription = "berdasarkan pencarian teks";
          break;
        case 'multimodal':
          modeDescription = "berdasarkan analisis teks dan gambar";
          break;
        case 'image':
          modeDescription = "berdasarkan analisis gambar";
          break;
      }
      
      aiResponse = `Berdasarkan data yang tersedia ${modeDescription}, saya menemukan ${ragResults.length} lokasi yang relevan dengan pertanyaan Anda.

**Lokasi Paling Relevan: ${topResult.location_name}**
- Grade: ${topResult.grade} (${topResult.score}/100)
- Tipe: ${topResult.type === 'clean' ? 'Bersih' : 'Kotor'}
- Alamat: ${topResult.address}
- Kota: ${topResult.city}, ${topResult.province}
- Similarity: ${(topResult.similarity_score * 100).toFixed(1)}%`;

      if (searchMode === 'multimodal' && topResult.text_similarity && topResult.image_similarity) {
        aiResponse += `
- Text Match: ${(topResult.text_similarity * 100).toFixed(1)}%
- Image Match: ${(topResult.image_similarity * 100).toFixed(1)}%`;
      }

      aiResponse += `

${topResult.ai_description}

${ragResults.length > 1 ? `\nSaya juga menemukan ${ragResults.length - 1} lokasi lain yang mungkin relevan untuk Anda.` : ''}`;
    } else {
      aiResponse = `Maaf, saya tidak menemukan informasi yang relevan dengan ${searchMode === 'text' ? 'pencarian teks' : searchMode === 'image' ? 'gambar' : 'pencarian multimodal'} Anda. Coba gunakan kata kunci yang berbeda atau lebih spesifik seperti nama lokasi, jenis tempat, atau kondisi kebersihan yang ingin dicari.`;
    }

    return NextResponse.json({
      message: aiResponse,
      rag_results: ragResults,
      search_mode: searchMode,
      embeddings_info: {
        text_embedding_length: textEmbedding?.length || 0,
        image_embedding_length: imageEmbedding?.length || 0
      }
    });

  } catch (error) {
    console.error('ChatBot RAG error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}