import { Navbar } from "@/components/common/navbar";
import { GradingForm } from "@/components/grading/grading-form";

const Page = () => {
  return (
    <>
      <Navbar title="Grading Kebersihan" />
      <main className="min-h-screen bg-gray-50 py-5">
        <GradingForm />
      </main>
    </>
  );
};

export default Page;
