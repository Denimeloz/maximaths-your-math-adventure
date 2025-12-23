import { Book, GraduationCap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sky-cloud/90 backdrop-blur-md border-b-2 border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl md:text-3xl font-display text-rainbow bg-clip-text">
            <span className="text-rainbow-yellow">M</span>
            <span className="text-rainbow-orange">A</span>
            <span className="text-rainbow-pink">X</span>
            <span className="text-rainbow-purple">I</span>
            <span className="text-rainbow-blue">M</span>
            <span className="text-rainbow-green">A</span>
            <span className="text-rainbow-yellow">T</span>
            <span className="text-rainbow-orange">H</span>
            <span className="text-rainbow-pink">S</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="nav" size="sm" className="gap-2">
            <Book className="w-4 h-4" />
            Collège
          </Button>
          <Button variant="nav" size="sm" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Lycée
          </Button>
          <Button variant="nav" size="sm" className="gap-2">
            <Info className="w-4 h-4" />
            À propos
          </Button>
        </nav>

        {/* CTA Button */}
        <Button variant="orange" size="sm" className="shadow-[0_4px_0_hsl(25_100%_35%)] text-sm">
          🎓 Espace Élève
        </Button>
      </div>
    </header>
  );
};

export default Header;
