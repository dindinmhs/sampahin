import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET - Mengambil pesan chat berdasarkan report_id
 * Mendukung pencarian dengan UUID lengkap atau partial match
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("report_id");

    if (!reportId) {
      return NextResponse.json(
        { error: "report_id is required" },
        { status: 400 }
      );
    }

    // Mengambil pesan chat dari tabel forum_reports_chat berdasarkan report_id
    let { data: messages, error } = await supabase
      .from("forum_reports_chat")
      .select("id, message, created_at, sender_id, report_id")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });

    // Jika tidak ditemukan dan reportId seperti UUID, coba partial match
    if ((!messages || messages.length === 0) && reportId.length > 10) {
      const { data: partialMessages, error: partialError } = await supabase
        .from("forum_reports_chat")
        .select("id, message, created_at, sender_id, report_id")
        .like("report_id", `${reportId.substring(0, 20)}%`)
        .order("created_at", { ascending: true });
      
      if (partialMessages && partialMessages.length > 0) {
        messages = partialMessages;
        error = partialError;
      }
    }

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch messages", details: error.message },
        { status: 500 }
      );
    }

    // Transform data dengan nama pengguna yang sebenarnya dari cleanliness_reports_with_user
    const transformedMessages = await Promise.all((messages || []).map(async (msg) => {
      let displayName = "Unknown User";
      
      try {
        // Cari nama user dari cleanliness_reports_with_user berdasarkan reporter (sender_id)
        const { data: userInfo, error: userError } = await supabase
          .from("cleanliness_reports_with_user")
          .select("reporter_name, email")
          .eq("reporter", msg.sender_id)
          .limit(1)
          .single();
        
        if (!userError && userInfo) {
          displayName = userInfo.reporter_name || userInfo.email?.split('@')[0] || "Unknown User";
        } else {
          // Fallback: gunakan short ID
          if (msg.sender_id && msg.sender_id.length >= 8) {
            const shortId = msg.sender_id.slice(-8);
            displayName = `User ${shortId}`;
          }
        }
      } catch (error) {
        console.log("Failed to get user info for", msg.sender_id, error);
        // Fallback: gunakan short ID
        if (msg.sender_id && msg.sender_id.length >= 8) {
          const shortId = msg.sender_id.slice(-8);
          displayName = `User ${shortId}`;
        }
      }

      return {
        id: msg.id.toString(),
        content: msg.message,
        user_name: displayName,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      };
    }));

    return NextResponse.json({ 
      messages: transformedMessages
    });
  } catch (error) {
    console.error("Error in GET /api/chat:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Mengirim pesan baru ke chat
 * Memerlukan autentikasi dan akan menyimpan pesan dengan sender_id dari user yang login
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { message, report_id } = body;

    if (!message || !report_id) {
      return NextResponse.json(
        { error: "message and report_id are required" },
        { status: 400 }
      );
    }

    // Mendapatkan user yang sedang login
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Persiapkan data untuk insert ke database
    const insertData = {
      message: message.trim(),
      report_id: report_id,
      sender_id: user.id,
    };

    const { data: result, error } = await supabase
      .from("forum_reports_chat")
      .insert(insertData)
      .select("id, message, created_at, sender_id, report_id")
      .single();

    if (error) {
      return NextResponse.json(
        { 
          error: "Failed to save message", 
          details: error.message
        },
        { status: 500 }
      );
    }

    // Mendapatkan nama display pengguna dari cleanliness_reports_with_user
    let displayName = "Unknown User";
    
    try {
      // Cari nama user dari cleanliness_reports_with_user berdasarkan reporter (user.id)
      const { data: userInfo, error: userError } = await supabase
        .from("cleanliness_reports_with_user")
        .select("reporter_name, email")
        .eq("reporter", user.id)
        .limit(1)
        .single();
      
      if (!userError && userInfo) {
        displayName = userInfo.reporter_name || userInfo.email?.split('@')[0] || "Unknown User";
      } else {
        // Fallback: ambil dari user metadata
        const userMetadata = user.user_metadata || {};
        
        if (userMetadata.full_name) {
          displayName = userMetadata.full_name;
        } else if (userMetadata.name) {
          displayName = userMetadata.name;
        } else if (user.email) {
          // Fallback: gunakan bagian email sebelum @
          displayName = user.email.split('@')[0];
        }
      }
    } catch (error) {
      console.log("Failed to get user display name", error);
      // Fallback terakhir
      if (user.email) {
        displayName = user.email.split('@')[0];
      }
    }

    // Transform data untuk format yang diharapkan komponen frontend
    const transformedMessage = {
      id: result.id.toString(),
      content: result.message,
      user_name: displayName,
      created_at: result.created_at,
      sender_id: result.sender_id,
    };

    return NextResponse.json({ message: transformedMessage });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
