"use client";
import { useEffect, useState } from "react";
import { useModalStore } from "@/lib/store/modal-store";
import { DragCloseDrawer } from "@/components/common/modal";
import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Mission } from "@/types/mission";

export function DailyMissionModal() {
  const dailyMissionOpen = useModalStore((s) => s.dailyMissionOpen);
  const setDailyMissionOpen = useModalStore((s) => s.setDailyMissionOpen);
  const user = useUserStore((state) => state.user);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMissions = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_missions_with_status")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("point_reward", { ascending: true });
    if (error) {
      console.error("Error fetching missions:", error.message);
    } else {
      setMissions(data as Mission[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user?.id]);

  return (
    <DragCloseDrawer
      open={dailyMissionOpen}
      setOpen={(value) =>
        setDailyMissionOpen(typeof value === "function" ? value(dailyMissionOpen) : value)
      }
    >
      <div className="text-center py-8 px-4">
        <h2 className="text-xl font-bold mb-4">Misi Harian</h2>
        <button
          onClick={fetchMissions}
          className="mb-4 flex items-center gap-2 mx-auto px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Cek Status
        </button>
        {loading ? (
          <p>Memuat misi...</p>
        ) : missions.length === 0 ? (
          <p>Tidak ada misi untuk hari ini.</p>
        ) : (
          <ul className="space-y-2 text-left">
            {missions.map((mission) => (
              <li
                key={mission.mission_id}
                className="border rounded-xl shadow bg-white"
              >
                <button
                  className="w-full flex justify-between items-center px-4 py-3 focus:outline-none"
                  onClick={() =>
                    setExpanded((prev) =>
                      prev === mission.mission_id ? null : mission.mission_id
                    )
                  }
                >
                  <span className="font-semibold">
                    {mission.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-green-600 font-medium text-sm">
                      +{mission.point_reward} poin
                    </span>
                    {expanded === mission.mission_id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
                {expanded === mission.mission_id && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
                    <div>
                      {mission.status === "completed" ? (
                        <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Selesai
                        </span>
                      ) : (
                        <span className="text-sm px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                          Belum
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DragCloseDrawer>
  );
}
