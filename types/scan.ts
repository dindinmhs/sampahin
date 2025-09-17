// Interface untuk hasil analisis basic yang disederhanakan
export interface BasicAnalysis {
  namaObjek: string;
  kategori: string;
  statusBahaya: string;
}

// Interface untuk artikel kreasi
export interface CreativeArticle {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  timeRequired: string;
  materials: string[];
  tools: string[];
  steps: string[];
  tips: string[];
  finalResult: string;
  benefits: string[];
  imageUrl?: string | null; // URL gambar yang dihasilkan oleh Nano Banana
}

// Interface untuk response API yang baru
export interface AnalysisResponse {
  result?: string;
  isNotTrash: boolean;
  isDemo?: boolean;
  detectedType?: string | null;
  basicAnalysis?: BasicAnalysis | null;
  kreatiArticles?: CreativeArticle[] | null;
}

// Interface untuk hasil analisis yang terstruktur (untuk parsing text)
export interface AnalysisResult {
  namaObjek?: string;
  kategori?: string;
  statusBahaya?: string;
  rawText?: string;
}