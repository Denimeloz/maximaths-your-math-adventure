import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ClassInfoSection from "@/components/ClassInfoSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ClassInfoSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
