import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import newLogo from "@/assets/new-logo.png";

const AdminLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="card-sticker bg-card border-rainbow-purple/30 p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img 
            src={newLogo} 
            alt="MAXIMATHS Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rainbow-purple/20 rounded-full mb-6">
          <Shield className="w-5 h-5 text-rainbow-purple" />
          <span className="text-rainbow-purple font-body font-semibold">
            Accès Administration
          </span>
        </div>
        
        <h1 className="text-2xl font-display text-foreground mb-4">
          Espace Administrateur
        </h1>
        
        <p className="text-muted-foreground font-body mb-6">
          Accès réservé à l'administrateur du site MAXIMATHS.
        </p>
        
        <Button 
          className="w-full btn-3d bg-rainbow-purple hover:bg-rainbow-purple/90 rounded-xl text-lg py-6"
          onClick={() => navigate('/auth')}
        >
          <Shield className="w-5 h-5 mr-2" />
          Se connecter
        </Button>
        
        <Button 
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => navigate('/')}
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default AdminLogin;