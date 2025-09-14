import { Navbar } from "@/components/common/navbar";
import { CityLeaderboard } from "@/components/leaderboard/city-leaderboard";

const Page = () => {
  return (
    <>
      <Navbar title="Leaderboard Kota" />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-6">
        <CityLeaderboard />
      </main>
    </>
  );
};

export default Page;
