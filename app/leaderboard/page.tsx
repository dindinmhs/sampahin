import { Navbar } from "@/components/common/navbar";
import { CityLeaderboard } from "@/components/leaderboard/city-leaderboard";

const Page = () => {
  return (
    <>
      <Navbar title="Leaderboard Kota" />
      <main className="min-h-screen bg-gray-50 py-5">
        <CityLeaderboard />
      </main>
    </>
  );
};

export default Page;
