import { Mail, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import newLogo from "@/assets/new-logo.png";

const Footer = () => {
  return (
    <footer className="bg-footer-gradient text-foreground py-16 relative overflow-hidden border-t border-border">
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Logo + Jules Verne */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
              <img
                src={newLogo}
                alt="Logo École Internationale Jules Verne"
                className="w-16 h-16 rounded-xl shadow-md bg-card p-1"
              />
              <div>
                <h3 className="text-3xl font-display leading-none">
                  <span className="text-secondary">MAXI</span>
                  <span className="text-primary">MATHS</span>
                </h3>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  École Internationale Jules Verne
                </p>
              </div>
            </div>
            <p className="font-body font-semibold text-muted-foreground">Par APELETE Maxime</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 font-body font-semibold">
            <Link to="/niveau/6eme/cours" className="text-foreground hover:text-secondary transition-colors">Collège</Link>
            <Link to="/niveau/seconde/cours" className="text-foreground hover:text-secondary transition-colors">Lycée</Link>
            <Link to="/about" className="text-foreground hover:text-secondary transition-colors">À propos</Link>
            <a href="mailto:maximathsclasse@gmail.com" className="text-foreground hover:text-secondary transition-colors">Contact</a>
            <Link to="/admin-login" className="text-muted-foreground hover:text-secondary transition-colors opacity-60 text-sm">Admin</Link>
          </nav>

          {/* Contact */}
          <div className="text-center md:text-right">
            <a
              href="mailto:maximathsclasse@gmail.com"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card hover:bg-secondary/10 transition-all font-body font-semibold border border-border shadow-sm hover:shadow-md text-foreground"
            >
              <Mail className="w-5 h-5 text-primary" />
              maximathsclasse@gmail.com
            </a>
          </div>
        </div>

        <div className="my-10 border-t border-border" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-body text-muted-foreground">
          <p>© 2024 MAXIMATHS — École Internationale Jules Verne. Tous droits réservés.</p>
          <p className="flex items-center gap-2">
            Fait avec <Heart className="w-4 h-4 text-destructive fill-destructive" /> pour les maths
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
