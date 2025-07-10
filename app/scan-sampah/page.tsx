import { Navbar } from "@/components/common/navbar"
import { ScanForm } from "@/components/scan-sampah/scan-form"

const Page = () => {

  return (
    <>
      <Navbar title="Scan Sampah"/>
      <main className="min-h-screen bg-gray-50 py-20">
        <ScanForm/>
      </main>
    </>
  )
}

export default Page