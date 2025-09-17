import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

interface EmbeddingRequest {
  text: string;
  imageBase64?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64 }: EmbeddingRequest = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Setup Google Auth
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      credentials: JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
        (() => { throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON env variable is not set'); })()
      )
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = 'us-central1'; // atau region yang Anda gunakan
    const model = 'multimodalembedding@001';

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

    // Prepare request body for multimodal embedding
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
      const errorText = await response.text();
      console.error('Vertex AI API error:', errorText);
      throw new Error(`Vertex AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract embeddings from response
    const textEmbedding = data.predictions?.[0]?.textEmbedding || null;
    const imageEmbedding = data.predictions?.[0]?.imageEmbedding || null;

    return NextResponse.json({
      textEmbedding,
      imageEmbedding,
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}