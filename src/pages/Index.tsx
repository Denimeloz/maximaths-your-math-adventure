import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LevelCards from "@/components/LevelCards";
import FeaturesSection from "@/components/FeaturesSection";
import DashboardPreview from "@/components/DashboardPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <LevelCards />
        <FeaturesSection />
        <DashboardPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
