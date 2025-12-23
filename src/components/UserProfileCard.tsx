import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function UserProfileCard() {
  const { profile } = useAuth();

  const getLevelLabel = (level: string | null | undefined) => {
    if (level === 'college') return 'Collège';
    if (level === 'lycee') return 'Lycée';
    return 'Multi-niveau';
  };

  return (
    <div className="card-sticker bg-card border-primary/20 p-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rainbow-purple to-rainbow-pink flex items-center justify-center mb-4">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <User className="w-12 h-12 text-secondary-foreground" />
          )}
        </div>
        <h2 className="text-2xl font-display text-foreground">
          {profile?.first_name} {profile?.last_name}
        </h2>
        <p className="text-muted-foreground font-body">
          {profile?.profession || 'Explorateur des maths'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          <Mail className="w-5 h-5 text-rainbow-blue" />
          <div>
            <p className="text-xs text-muted-foreground font-body">Email</p>
            <p className="text-foreground font-body">{profile?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          <GraduationCap className="w-5 h-5 text-rainbow-green" />
          <div>
            <p className="text-xs text-muted-foreground font-body">Niveau</p>
            <p className="text-foreground font-body">{getLevelLabel(profile?.level)}</p>
          </div>
        </div>

        {profile?.profession && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <Briefcase className="w-5 h-5 text-rainbow-purple" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Profession</p>
              <p className="text-foreground font-body">{profile.profession}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          <Calendar className="w-5 h-5 text-rainbow-orange" />
          <div>
            <p className="text-xs text-muted-foreground font-body">Membre depuis</p>
            <p className="text-foreground font-body">
              {profile?.created_at 
                ? format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: fr })
                : 'Date inconnue'
              }
            </p>
          </div>
        </div>

        {profile?.bio && (
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground font-body mb-1">Bio</p>
            <p className="text-foreground font-body">{profile.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
