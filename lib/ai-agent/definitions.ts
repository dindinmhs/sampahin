import { Type, FunctionDeclaration } from '@google/genai';

export const functionDefinitions: FunctionDeclaration[] = [
  {
    name: 'search_locations',
    description: 'Mencari lokasi berdasarkan query dan filter kebersihan. Gunakan untuk mencari tempat bersih/kotor, rekomendasi lokasi.',
    parameters: {
      type: Type.OBJECT,
      required: ["query"],
      properties: {
        query: {
          type: Type.STRING,
          description: "Text pencarian nama lokasi, alamat, atau deskripsi",
        },
        filters: {
          type: Type.OBJECT,
          properties: {
            grade: {
              type: Type.ARRAY,
              description: "Filter grade kebersihan A, B, C, D, E",
              items: {
                type: Type.STRING,
                enum: ["A", "B", "C", "D", "E"],
              },
            },
            city: {
              type: Type.STRING,
              description: "Nama kota",
            },
            type: {
              type: Type.STRING,
              enum: ["clean", "dirty", "cleaning"],
              description: "Tipe lokasi"
            }
          },
        },
      },
    },
  },
  {
    name: 'show_location_details',
    description: 'Menampilkan detail lokasi dan membuka sidebar. Gunakan ketika user ingin melihat detail tempat tertentu.',
    parameters: {
      type: Type.OBJECT,
      required: ["location_id"],
      properties: {
        location_id: {
          type: Type.STRING,
          description: "ID lokasi yang akan ditampilkan detailnya",
        },
        focus_map: {
          type: Type.BOOLEAN,
          description: "Apakah peta harus fokus ke lokasi ini",
        }
      },
    },
  },
  {
    name: 'navigate_to_location',
    description: 'Memulai navigasi ke lokasi tertentu. Gunakan ketika user minta rute atau arah ke suatu tempat.',
    parameters: {
      type: Type.OBJECT,
      required: ["location_id"],
      properties: {
        location_id: {
          type: Type.STRING,
          description: "ID lokasi tujuan navigasi",
        },
        transport_mode: {
          type: Type.STRING,
          enum: ["driving", "walking"],
          description: "Mode transportasi untuk navigasi",
        }
      },
    },
  },
  {
    name: 'highlight_locations',
    description: 'Highlight lokasi-lokasi tertentu di peta dengan visual yang menonjol.',
    parameters: {
      type: Type.OBJECT,
      required: ["location_ids"],
      properties: {
        location_ids: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "Array ID lokasi yang akan di-highlight",
        },
        highlight_type: {
          type: Type.STRING,
          enum: ["pulse", "glow", "bounce"],
          description: "Jenis efek highlight",
        }
      },
    },
  },
  {
    name: 'set_map_filter',
    description: 'Mengatur filter kategori yang ditampilkan di peta.',
    parameters: {
      type: Type.OBJECT,
      required: ["filter"],
      properties: {
        filter: {
          type: Type.STRING,
          enum: ["all", "clean", "dirty", "cleaning"],
          description: "Kategori filter untuk peta",
        }
      },
    },
  },
  {
    name: 'find_nearby_locations',
    description: 'Mencari lokasi terdekat dari posisi user atau koordinat tertentu.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        coordinates: {
          type: Type.ARRAY,
          items: {
            type: Type.NUMBER,
          },
          description: "Koordinat [lat, lon] sebagai titik referensi. Kosongkan untuk gunakan lokasi user.",
        },
        radius_km: {
          type: Type.NUMBER,
          description: "Radius pencarian dalam kilometer (default: 5km)",
        },
        filter_type: {
          type: Type.STRING,
          enum: ["clean", "dirty", "cleaning"],
          description: "Filter jenis lokasi yang dicari",
        }
      },
    },
  }
] as const;