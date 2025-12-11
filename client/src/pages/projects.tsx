import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Projects() {
  // Set page title and meta description
  useEffect(() => {
    document.title = "Todos os Projetos - Bruna Barboza";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore a coleção completa de projetos de Bruna Barboza, incluindo aplicações web, designs inovadores e soluções digitais.');
    }
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { published: true }],
    queryFn: async () => {
      const response = await fetch("/api/projects?published=true", {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project: Project) => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a: Project, b: Project) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "most-liked":
          return b.likes - a.likes;
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Get unique categories from projects
  const categories = Array.from(new Set(projects.map((p: Project) => p.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="projects-page">
      <Navigation />

      {/* Header Section */}
      <section className="pt-20 sm:pt-24 pb-8 sm:pb-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-foreground" data-testid="projects-page-title">
              Todos os Projetos
            </h1>
          </div>
        </div>
      </section>

      {/* Filters and Search Section */}
      <section className="py-6 sm:py-8 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-4 items-stretch max-w-6xl mx-auto">
            {/* Search */}
            <div className="relative w-full" data-testid="search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search"
              />
            </div>

            {/* Category Filter and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center sm:justify-center">
              <div className="flex items-center gap-2" data-testid="category-filter">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-44" data-testid="select-category">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category} data-testid={`category-${category}`}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-44" data-testid="select-sort">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" data-testid="sort-newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest" data-testid="sort-oldest">Mais antigos</SelectItem>
                  <SelectItem value="most-liked" data-testid="sort-most-liked">Mais curtidos</SelectItem>
                  <SelectItem value="alphabetical" data-testid="sort-alphabetical">Alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground" data-testid="results-count">
              {isLoading ? "Carregando..." : `${filteredProjects.length} projeto${filteredProjects.length !== 1 ? 's' : ''} encontrado${filteredProjects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
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
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16" data-testid="no-projects-found">
              <p className="text-xl text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Nenhum projeto encontrado com os filtros aplicados."
                  : "Nenhum projeto publicado ainda."
                }
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="projects-grid">
              {filteredProjects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Back to Top */}
      <div className="text-center py-8">
        <Button
          variant="outline"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-8 py-3"
          data-testid="button-back-to-top"
        >
          Voltar ao topo
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-muted-foreground" data-testid="footer-copyright">
              © 2025 Bruna Barboza. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground mt-2" data-testid="footer-tech">
              Desenvolvido com React, Tailwind CSS e muito ☕
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}