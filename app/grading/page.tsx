import { Navbar } from "@/components/common/navbar"
import { GradingForm } from "@/components/grading/grading-form"

const Page = () => {
  

  return (
    <>
      <Navbar title="Grading"/>
      <main className="min-h-screen bg-gray-50 py-20">
        <GradingForm/>
      </main>
    </>
  )
}

export default Page