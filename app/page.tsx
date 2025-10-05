import Header from "@/components/landing-page/header-wrapper";
import HeroSection from "@/components/landing-page/hero-section";
import FeaturesSection from "@/components/landing-page/features-section";
import HowItWorksSection from "@/components/landing-page/how-it-works-section";
import AppShowcaseSection from "@/components/landing-page/app-show-case";
import FAQSection from "@/components/landing-page/faq";
import CTASection from "@/components/landing-page/cta-section";
import Footer from "@/components/landing-page/footer";
import VideoDemoSection from "@/components/landing-page/video-demo-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <HeroSection />
      <VideoDemoSection/>
      <FeaturesSection />
      <HowItWorksSection />
      <AppShowcaseSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
