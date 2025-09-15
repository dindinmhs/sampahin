import { Type } from '@google/genai';

export const mapsFunctionDefinitions = [
  {
    name: 'search_locations',
    description: 'Mencari lokasi berdasarkan query dan filter kebersihan. Gunakan untuk mencari tempat bersih/kotor atau kondisi area tertentu.',
    parameters: {
      type: Type.OBJECT,
      required: ["query"],
      properties: {
        query: {
          type: Type.STRING,
          description: "Text pencarian nama lokasi, alamat, atau deskripsi tempat",
        },
        filters: {
          type: Type.OBJECT,
          properties: {
            grade: {
              type: Type.ARRAY,
              description: "Filter grade kebersihan A=Sangat Bersih, E=Sangat Kotor",
              items: {
                type: Type.STRING,
                enum: ["A", "B", "C", "D", "E"],
              },
            },
            city: {
              type: Type.STRING,
              description: "Nama kota untuk pencarian",
            },
            type: {
              type: Type.STRING,
              enum: ["clean", "dirty", "cleaning"],
              description: "Tipe lokasi: clean=bersih, dirty=kotor, cleaning=sedang dibersihkan",
            },
          },
        },
      },
    },
  },
  {
    name: 'show_location_details',
    description: 'Menampilkan detail lokasi dengan membuka sidebar. Gunakan ketika user ingin melihat informasi lengkap suatu tempat.',
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
          description: "Apakah peta harus fokus ke lokasi ini (zoom dan center)",
        },
      },
    },
  },
  {
    name: 'show_navigation_route',
    description: 'Menampilkan rute navigasi ke lokasi tujuan. Gunakan ketika user meminta arah atau rute ke suatu tempat.',
    parameters: {
      type: Type.OBJECT,
      required: ["destination_location_id"],
      properties: {
        destination_location_id: {
          type: Type.STRING,
          description: "ID lokasi tujuan untuk navigasi",
        },
        open_google_maps: {
          type: Type.BOOLEAN,
          description: "Apakah langsung membuka Google Maps",
        },
      },
    },
  },
  {
    name: 'highlight_locations_on_map',
    description: 'Highlight beberapa lokasi di peta dengan marker khusus. Gunakan untuk menampilkan hasil pencarian atau perbandingan lokasi.',
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
        zoom_to_fit: {
          type: Type.BOOLEAN,
          description: "Apakah peta harus zoom untuk menampilkan semua lokasi",
        },
        highlight_color: {
          type: Type.STRING,
          enum: ["green", "red", "orange", "blue"],
          description: "Warna highlight untuk marker",
        },
      },
    },
  },
  {
    name: 'filter_map_category',
    description: 'Mengubah filter kategori peta untuk menampilkan jenis lokasi tertentu.',
    parameters: {
      type: Type.OBJECT,
      required: ["category"],
      properties: {
        category: {
          type: Type.STRING,
          enum: ["all", "clean", "dirty", "cleaning"],
          description: "Kategori filter: all=semua, clean=bersih saja, dirty=kotor saja, cleaning=sedang dibersihkan",
        },
      },
    },
  },
  {
    name: 'get_nearby_facilities',
    description: 'Mencari fasilitas terdekat seperti toilet umum atau tempat sampah di sekitar lokasi.',
    parameters: {
      type: Type.OBJECT,
      required: ["location_id"],
      properties: {
        location_id: {
          type: Type.STRING,
          description: "ID lokasi sebagai pusat pencarian",
        },
        facility_types: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: ["toilet", "trash_bin", "recycling", "water_source"],
          },
          description: "Jenis fasilitas yang dicari",
        },
        radius_km: {
          type: Type.NUMBER,
          description: "Radius pencarian dalam kilometer",
        },
      },
    },
  },
];