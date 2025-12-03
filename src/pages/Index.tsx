import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ReservationSection from "@/components/ReservationSection";
import AttractionsSection from "@/components/AttractionsSection";
import ExploreSection from "@/components/ExploreSection";
import CulturalSection from "@/components/CulturalSection";
import CommunitySection from "@/components/CommunitySection";
import BlogSection from "@/components/BlogSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
    <div className="min-h-screen">
      <Navbar />
      {/* <Hero /> */}
      <ExploreSection />
      <ReservationSection />
      <AttractionsSection />
      <CulturalSection />
      <CommunitySection />
      <BlogSection />
      <CTASection />
      <Footer />

    </div>
    </>
  );
};

export default Index;
