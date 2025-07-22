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

    // Mengambil pesan chat dari view forum_reports_chat_with_user
    let { data: messages, error } = await supabase
      .from("forum_reports_chat_with_user")
      .select("id, message, created_at, report_id, email, sender_name")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });

    // Get current user untuk menentukan apakah pesan dari user sendiri
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Jika tidak ditemukan dan reportId seperti UUID, coba partial match
    if ((!messages || messages.length === 0) && reportId.length > 10) {
      const { data: partialMessages, error: partialError } = await supabase
        .from("forum_reports_chat_with_user")
        .select("id, message, created_at, report_id, email, sender_name")
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

    // Transform data menggunakan sender_name dari view
    const transformedMessages = await Promise.all((messages || []).map(async (msg) => {
      const displayName = msg.sender_name || 
                         msg.email?.split('@')[0] || 
                         'Anonymous User';
      
      // Ambil sender_id yang sebenarnya dari tabel untuk pengecekan current user
      let actualSenderId = 'unknown';
      try {
        const { data: tableMsg } = await supabase
          .from('forum_reports_chat')
          .select('sender_id')
          .eq('id', msg.id)
          .single();
        
        actualSenderId = tableMsg?.sender_id || 'unknown';
      } catch (err) {
        console.log('Failed to get sender_id:', err);
      }
      
      return {
        id: msg.id?.toString() || 'unknown',
        content: msg.message || '',
        user_name: displayName,
        created_at: msg.created_at || new Date().toISOString(),
        sender_id: actualSenderId,
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

    // Transform data untuk format yang diharapkan komponen frontend
    // Langsung gunakan metadata user untuk nama
    const displayName = user.user_metadata?.full_name || 
                       user.email?.split('@')[0] || 
                       `User ${user.id.slice(-8)}`;
    
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
