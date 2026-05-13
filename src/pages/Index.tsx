import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ClassInfoSection from "@/components/ClassInfoSection";
import ClassPhotosSection from "@/components/ClassPhotosSection";
import DnbRevisionSection from "@/components/DnbRevisionSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <DnbRevisionSection />
        <ClassInfoSection />
        <ClassPhotosSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
