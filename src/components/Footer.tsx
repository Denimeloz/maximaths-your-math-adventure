import { Mail, Heart, Star, Sparkles } from "lucide-react";
import brainIcon from "@/assets/brain-icon.png";

const Footer = () => {
  return (
    <footer className="bg-footer-gradient text-secondary-foreground py-16 relative overflow-hidden">
      {/* Decorative elements */}
      <Star className="absolute top-10 left-[10%] w-6 h-6 fill-rainbow-yellow/30 text-rainbow-yellow/30 animate-float" />
      <Sparkles className="absolute top-20 right-[15%] w-8 h-8 text-rainbow-pink/30 animate-wiggle" />
      <Star className="absolute bottom-20 left-[25%] w-5 h-5 fill-rainbow-blue/30 text-rainbow-blue/30 animate-float-delayed" />
      
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Logo */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <img src={brainIcon} alt="" className="w-14 h-14 rounded-xl shadow-lg" />
              <h3 className="text-4xl font-display">
                <span className="text-rainbow-yellow">MAXI</span>
                <span className="text-sky-cloud">MATHS</span>
              </h3>
            </div>
            <p className="font-body font-semibold opacity-90 text-lg">Par APELETE Maxime</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-8 font-body font-bold text-lg">
            <a href="#" className="hover:text-rainbow-yellow transition-colors hover:scale-105 inline-block">Collège</a>
            <a href="#" className="hover:text-rainbow-yellow transition-colors hover:scale-105 inline-block">Lycée</a>
            <a href="#" className="hover:text-rainbow-yellow transition-colors hover:scale-105 inline-block">À propos</a>
            <a href="#" className="hover:text-rainbow-yellow transition-colors hover:scale-105 inline-block">Contact</a>
          </nav>

          {/* Contact */}
          <div className="text-center md:text-right">
            <a 
              href="mailto:maximathsclasse@gmail.com"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-sky-cloud/20 hover:bg-sky-cloud/30 transition-all font-body font-bold text-lg border-4 border-sky-cloud/30 hover:scale-105 shadow-lg"
            >
              <Mail className="w-6 h-6" />
              maximathsclasse@gmail.com
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t-4 border-sky-cloud/20 rounded-full" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-base font-body opacity-90">
          <p className="font-semibold">© 2024 MAXIMATHS. Tous droits réservés.</p>
          <p className="flex items-center gap-2 font-semibold">
            Fait avec <Heart className="w-5 h-5 text-rainbow-pink fill-rainbow-pink animate-pulse" /> pour les maths
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;