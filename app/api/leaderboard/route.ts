import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Ambil data user ranking berdasarkan total points dari point_transactions
    const { data: pointTransactions, error: pointError } = await supabase.from(
      "point_transactions"
    ).select(`
        *,
        auth_users:user_id (
          id,
          email
        )
      `);

    if (pointError) {
      console.error("Point transactions error:", pointError);
      return NextResponse.json(
        { error: "Failed to fetch point transactions" },
        { status: 500 }
      );
    }

    // Ambil data dari user_mission_logs untuk point earned
    const { data: missionLogs, error: missionError } = await supabase.from(
      "user_mission_logs"
    ).select(`
        *,
        auth_users:user_id (
          id,
          email
        )
      `);

    if (missionError) {
      console.error("Mission logs error:", missionError);
      return NextResponse.json(
        { error: "Failed to fetch mission logs" },
        { status: 500 }
      );
    }

    // Combine data dan hitung total points per user
    const userPoints: { [key: string]: any } = {};

    // Process point transactions
    pointTransactions?.forEach((transaction: any) => {
      const userId = transaction.user_id;
      const amount = parseInt(transaction.amount) || 0;

      if (!userPoints[userId]) {
        userPoints[userId] = {
          userId,
          email: transaction.auth_users?.email || "Unknown",
          totalPoints: 0,
          missionsCompleted: 0,
          transactionsCount: 0,
        };
      }

      // Jika type adalah 'earn' atau 'reward', tambahkan ke total points
      if (transaction.type === "earn" || transaction.type === "reward") {
        userPoints[userId].totalPoints += amount;
      }
      userPoints[userId].transactionsCount++;
    });

    // Process mission logs untuk point earned
    missionLogs?.forEach((log: any) => {
      const userId = log.user_id;
      const pointsEarned = parseInt(log.point_earned) || 0;

      if (!userPoints[userId]) {
        userPoints[userId] = {
          userId,
          email: log.auth_users?.email || "Unknown",
          totalPoints: 0,
          missionsCompleted: 0,
          transactionsCount: 0,
        };
      }

      userPoints[userId].totalPoints += pointsEarned;
      userPoints[userId].missionsCompleted++;
    });

    // Convert ke array dan sort berdasarkan total points
    const users = Object.values(userPoints)
      .filter((user: any) => user.totalPoints > 0) // Filter users dengan points > 0
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    // Assign ranking
    users.forEach((user: any, index: number) => {
      user.rank = index + 1;
    });

    // Ambil statistik umum
    const totalUsers = users.length;
    const totalPoints = users.reduce(
      (sum: number, user: any) => sum + user.totalPoints,
      0
    );
    const totalMissions = users.reduce(
      (sum: number, user: any) => sum + user.missionsCompleted,
      0
    );

    return NextResponse.json({
      success: true,
      data: users,
      stats: {
        totalUsers,
        totalPoints,
        totalMissions,
        avgPointsPerUser:
          totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0,
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
