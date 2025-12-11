import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { AchievementCard } from "@/components/achievement-card";
import { Calendar, Award, TrendingUp } from "lucide-react";
import type { Achievement } from "@shared/schema";

export default function Certifications() {
  const { data: certifications = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      const response = await fetch("/api/achievements");
      return response.json();
    },
  });

  const totalCertifications = certifications.length;
  const totalLikes = certifications.reduce((sum, cert) => sum + cert.likes, 0);
  const mostRecentYear = certifications.length > 0 
    ? Math.max(...certifications.map(cert => new Date(cert.date).getFullYear()))
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="certifications-page">
      <Navigation />
      
      {/* Header Section */}
      <section className="pt-20 sm:pt-24 pb-10 sm:pb-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-6 sm:mb-8 text-foreground" data-testid="certifications-title">
              Certificações
            </h1>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto px-4" data-testid="certifications-stats">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-primary/20 rounded-full">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary" data-testid="stats-total-certifications">{totalCertifications}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Certificações</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-primary/20 rounded-full">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary" data-testid="stats-total-likes">{totalLikes}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Curtidas</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-primary/20 rounded-full">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary" data-testid="stats-recent-year">{mostRecentYear}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Ano Recente</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="glass-morphism rounded-xl p-4 sm:p-6 animate-pulse" data-testid={`certification-skeleton-${i}`}>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted/50 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-muted/50 rounded mb-2"></div>
                  <div className="h-12 bg-muted/50 rounded mb-4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/2 mx-auto"></div>
                </Card>
              ))}
            </div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-12 sm:py-16" data-testid="no-certifications">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-muted/20 rounded-full flex items-center justify-center">
                <Award className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Nenhuma Certificação Ainda</h3>
              <p className="text-base sm:text-xl text-muted-foreground px-4">
                Certificações e conquistas profissionais serão exibidas aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" data-testid="certifications-grid">
              {certifications.map((certification) => (
                <AchievementCard key={certification.id} achievement={certification} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 sm:py-12 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" data-testid="footer-title">Sempre Aprendendo</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4" data-testid="footer-description">
              Acredito no aprendizado contínuo e na importância de se manter atualizado com as mais recentes 
              tecnologias e práticas da indústria. Cada certificação representa um passo na minha jornada 
              de crescimento profissional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}