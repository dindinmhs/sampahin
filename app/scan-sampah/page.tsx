import { Navbar } from "@/components/common/navbar";
import { ScanForm } from "@/components/scan-sampah/scan-form";

const Page = () => {
  return (
    <>
      <Navbar title="Scan Sampah" />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-5">
        <ScanForm />
      </main>
    </>
  );
};

export default Page;
