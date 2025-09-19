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
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-background/90 to-primary/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="certifications-title">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Certificações
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="certifications-subtitle">
              Minhas conquistas profissionais e certificações que demonstram expertise em diversas tecnologias e áreas
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto" data-testid="certifications-stats">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary" data-testid="stats-total-certifications">{totalCertifications}</div>
                <div className="text-sm text-muted-foreground">Certificações</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-secondary/20 rounded-full">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-2xl font-bold text-secondary" data-testid="stats-total-likes">{totalLikes}</div>
                <div className="text-sm text-muted-foreground">Curtidas</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-accent/20 rounded-full">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-accent" data-testid="stats-recent-year">{mostRecentYear}</div>
                <div className="text-sm text-muted-foreground">Ano Recente</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="glass-morphism rounded-xl p-6 animate-pulse" data-testid={`certification-skeleton-${i}`}>
                  <div className="w-16 h-16 bg-muted/50 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-muted/50 rounded mb-2"></div>
                  <div className="h-12 bg-muted/50 rounded mb-4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/2 mx-auto"></div>
                </Card>
              ))}
            </div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-16" data-testid="no-certifications">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted/20 rounded-full flex items-center justify-center">
                <Award className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Nenhuma Certificação Ainda</h3>
              <p className="text-xl text-muted-foreground">
                Certificações e conquistas profissionais serão exibidas aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="certifications-grid">
              {certifications.map((certification) => (
                <AchievementCard key={certification.id} achievement={certification} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4" data-testid="footer-title">Sempre Aprendendo</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="footer-description">
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