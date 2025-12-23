import { Mail, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-footer-gradient text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-display mb-2">
              <span className="text-rainbow-yellow">MAXI</span>
              <span className="text-sky-cloud">MATHS</span>
            </h3>
            <p className="font-body opacity-90">Par APELETE Maxime</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 font-body">
            <a href="#" className="hover:text-rainbow-yellow transition-colors">Collège</a>
            <a href="#" className="hover:text-rainbow-yellow transition-colors">Lycée</a>
            <a href="#" className="hover:text-rainbow-yellow transition-colors">À propos</a>
            <a href="#" className="hover:text-rainbow-yellow transition-colors">Contact</a>
          </nav>

          {/* Contact */}
          <div className="text-center md:text-right">
            <a 
              href="mailto:maximathsclasse@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-cloud/20 hover:bg-sky-cloud/30 transition-colors font-body font-semibold"
            >
              <Mail className="w-5 h-5" />
              maximathsclasse@gmail.com
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-sky-cloud/20" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-body opacity-80">
          <p>© 2024 MAXIMATHS. Tous droits réservés.</p>
          <p className="flex items-center gap-2">
            Fait avec <Heart className="w-4 h-4 text-rainbow-pink fill-rainbow-pink" /> pour les maths
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
