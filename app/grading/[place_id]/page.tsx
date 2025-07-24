import { Navbar } from "@/components/common/navbar";
import { UpdateGradingForm } from "@/components/grading/update-grading";

const Page = () => {
  return (
    <>
      <Navbar title="Grading Kebersihan" />
      <main className="min-h-screen bg-gray-50 py-5">
        <UpdateGradingForm/>
      </main>
    </>
  );
};

export default Page;
