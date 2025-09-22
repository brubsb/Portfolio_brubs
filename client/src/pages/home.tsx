import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { ProjectCard } from "@/components/project-card";
import { AchievementCard } from "@/components/achievement-card";
import { ToolsCarousel } from "@/components/tools-carousel";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { ExternalLink, Linkedin, Github, Mail, Dribbble } from "lucide-react";
import { Link } from "wouter";
import type { Project } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  
  // Fetch public profile data
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile");
      return response.json();
    },
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { published: true, featured: true, limit: 6 }],
    queryFn: async () => {
      const response = await fetch("/api/projects?published=true&featured=true&limit=6");
      return response.json();
    },
  });

  const { data: certifications = [], isLoading: certificationsLoading } = useQuery({
    queryKey: ["/api/achievements", { featured: true, limit: 4 }],
    queryFn: async () => {
      const response = await fetch("/api/achievements?featured=true&limit=4");
      return response.json();
    },
  });

  // Handle real-time notifications
  useEffect(() => {
    if (lastMessage?.type === 'new_comment') {
      toast({
        title: "Novo comentário",
        description: "Um novo comentário foi adicionado a um projeto!",
      });
    }
  }, [lastMessage, toast]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const totalProjects = projects.length;
  const totalLikes = projects.reduce((sum: number, p: any) => sum + p.likes, 0) +
                    certifications.reduce((sum: number, a: any) => sum + a.likes, 0);
  // Get total comments from database
  const { data: totalComments = 0 } = useQuery({
    queryKey: ["/api/comments/count"],
    queryFn: async () => {
      const response = await fetch("/api/comments");
      const comments = await response.json();
      return comments.length;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="home-page">
      <Navigation />

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Gradient background with geometric shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/20"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <img
                src={profile?.aboutPhoto || "/uploads/1758308814878-651921657.png"}
                alt="Bruna Barboza Sofia - Professional Portrait"
                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-primary shadow-2xl object-cover"
                data-testid="hero-portrait"
              />
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up" data-testid="hero-title">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Portfólio Digital
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" data-testid="hero-subtitle">
              {profile?.aboutText || "Desenvolvedora Full Stack e Designer UI/UX apaixonada por criar experiências digitais memoráveis"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button
                asChild
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-all transform hover:scale-105 font-medium text-lg"
                data-testid="view-projects-button"
              >
                <Link to="/projects">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Ver Todos os Projetos
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="px-8 py-4 border border-border text-foreground rounded-lg hover:bg-muted transition-all font-medium text-lg"
                data-testid="linkedin-button"
              >
                <a href="https://linkedin.com/in/brunabarbozasofia" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn
                </a>
              </Button>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-md mx-auto" data-testid="hero-stats">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary" data-testid="stats-projects">{totalProjects}</div>
                <div className="text-sm text-muted-foreground">Projetos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary" data-testid="stats-likes">{totalLikes}</div>
                <div className="text-sm text-muted-foreground">Curtidas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent" data-testid="stats-comments">{totalComments}</div>
                <div className="text-sm text-muted-foreground">Comentários</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="projects-section-title">
              Projetos em Destaque
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="projects-section-subtitle">
              Uma seleção dos meus trabalhos mais recentes e impactantes
            </p>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass-morphism rounded-xl overflow-hidden animate-pulse" data-testid={`project-skeleton-${i}`}>
                  <div className="w-full h-48 bg-muted/50"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted/50 rounded mb-2"></div>
                    <div className="h-6 bg-muted/50 rounded mb-4"></div>
                    <div className="h-16 bg-muted/50 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16" data-testid="no-projects">
              <p className="text-xl text-muted-foreground">Nenhum projeto publicado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="projects-grid">
              {projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              variant="outline"
              asChild
              className="px-8 py-4 border border-border text-foreground rounded-lg hover:bg-muted transition-all font-medium"
              data-testid="view-all-projects-button"
            >
              <Link to="/projects">Ver Todos os Projetos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="certifications-section-title">
              Certificações em Destaque
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="certifications-section-subtitle">
              Principais certificações e conquistas profissionais
            </p>
          </div>

          {certificationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="glass-morphism rounded-xl p-6 animate-pulse" data-testid={`certification-skeleton-${i}`}>
                  <div className="w-16 h-16 bg-muted/50 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-muted/50 rounded mb-2"></div>
                  <div className="h-12 bg-muted/50 rounded"></div>
                </Card>
              ))}
            </div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-16" data-testid="no-certifications">
              <p className="text-xl text-muted-foreground">Nenhuma certificação em destaque ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="certifications-grid">
              {certifications.map((certification: any) => (
                <AchievementCard key={certification.id} achievement={certification} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              variant="outline"
              asChild
              className="px-8 py-4 border border-border text-foreground rounded-lg hover:bg-muted transition-all font-medium"
              data-testid="view-all-certifications-button"
            >
              <Link to="/certifications">Ver Todas as Certificações</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tools & Technologies Section */}
      <section id="tools" className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="tools-section-title">
              Ferramentas & Tecnologias
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="tools-section-subtitle">
              Principais tecnologias e ferramentas que utilizo no desenvolvimento
            </p>
          </div>

          <ToolsCarousel 
            featured={true} 
            limit={12} 
            className="max-w-6xl mx-auto" 
            data-testid="homepage-tools-carousel"
          />
        </div>
      </section>

      {/* About Me Section */}
      <section id="about" className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src={profile?.aboutPhoto || "/uploads/1758308814878-651921657.png"}
                  alt="Bruna Barboza Sofia - Professional About Photo"
                  className="rounded-2xl shadow-2xl w-full max-w-md mx-auto object-cover"
                  data-testid="about-photo"
                />
              </div>
              
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="about-title">Sobre Mim</h2>
                
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed" data-testid="about-description-1">
                  {profile?.aboutText || "Olá! Sou Bruna Barboza Sofia, desenvolvedora full-stack e designer UI/UX com mais de 5 anos de experiência criando soluções digitais inovadoras. Minha paixão é transformar ideias complexas em experiências digitais intuitivas e impactantes."}
                </p>
                
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed" data-testid="about-description-2">
                  {profile?.aboutDescription || "Especializo-me em React, Node.js, e design de interfaces, sempre buscando as melhores práticas e tecnologias mais recentes para entregar resultados excepcionais aos meus clientes."}
                </p>
                
                {/* Skills */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4" data-testid="about-skills-title">Principais Tecnologias</h3>
                  <div className="flex flex-wrap gap-3" data-testid="about-skills-list">
                    {(profile?.skills && profile.skills.length > 0 ? profile.skills : ["React", "Node.js", "MongoDB", "TypeScript", "Figma", "AWS"]).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium"
                        data-testid={`skill-${skill.toLowerCase()}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Social Links */}
                <div>
                  <h3 className="text-xl font-bold mb-4" data-testid="about-social-title">Conecte-se Comigo</h3>
                  <div className="flex space-x-4" data-testid="about-social-links">
                    <Button
                      asChild
                      size="icon"
                      className="w-12 h-12 bg-[#0077B5] hover:bg-[#0077B5]/80 rounded-full hover:scale-110 transition-transform"
                      data-testid="social-linkedin"
                    >
                      <a href="https://linkedin.com/in/brunabarbozasofia" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-6 w-6 text-white" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="icon"
                      className="w-12 h-12 bg-[#333] hover:bg-[#333]/80 rounded-full hover:scale-110 transition-transform"
                      data-testid="social-github"
                    >
                      <a href="https://github.com/brunabarbozasofia" target="_blank" rel="noopener noreferrer">
                        <Github className="h-6 w-6 text-white" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="icon"
                      className="w-12 h-12 bg-[#FF5722] hover:bg-[#FF5722]/80 rounded-full hover:scale-110 transition-transform"
                      data-testid="social-email"
                    >
                      <a href="mailto:brunabarbozasofia@gmail.com">
                        <Mail className="h-6 w-6 text-white" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="icon"
                      className="w-12 h-12 bg-[#FF0050] hover:bg-[#FF0050]/80 rounded-full hover:scale-110 transition-transform"
                      data-testid="social-dribbble"
                    >
                      <a href="https://dribbble.com/brunabarbozasofia" target="_blank" rel="noopener noreferrer">
                        <Dribbble className="h-6 w-6 text-white" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="font-bold" data-testid="footer-name">Bruna Barboza Sofia</h3>
              <p className="text-muted-foreground" data-testid="footer-title">Desenvolvedora Full Stack & UI/UX Designer</p>
            </div>
            
            <div className="flex justify-center space-x-6 mb-6" data-testid="footer-social-links">
              <a href="https://linkedin.com/in/brunabarbozasofia" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-linkedin">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="https://github.com/brunabarbozasofia" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-github">
                <Github className="h-6 w-6" />
              </a>
              <a href="mailto:brunabarbozasofia@gmail.com" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-email">
                <Mail className="h-6 w-6" />
              </a>
              <a href="https://dribbble.com/brunabarbozasofia" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-dribbble">
                <Dribbble className="h-6 w-6" />
              </a>
            </div>
            
            <div className="border-t border-border pt-6">
              <p className="text-muted-foreground" data-testid="footer-copyright">
                © 2024 Bruna Barboza Sofia. Todos os direitos reservados.
              </p>
              <p className="text-sm text-muted-foreground mt-2" data-testid="footer-tech">
                Desenvolvido com React, Tailwind CSS e muito ☕
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
