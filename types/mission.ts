export interface Mission {
  mission_id: string;
  title: string;
  description: string;
  point_reward: number;
  status: "completed" | "not_completed";
};