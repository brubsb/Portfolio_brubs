import { useState } from "react";
import { Heart, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { ProjectModal } from "./project-modal";
import { authManager } from "@/lib/auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = authManager.isAuthenticated();

  const { data: userLikes = [] } = useQuery({
    queryKey: ["/api/likes/user"],
    enabled: isAuthenticated,
  });

  const isLiked = userLikes.some((like: any) => like.projectId === project.id);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/likes/toggle", {
        projectId: project.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/likes/user"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para curtir projetos",
        variant: "destructive",
      });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/share/linkedin", {
        projectId: project.id,
      });
    },
    onSuccess: (response: any) => {
      const data = response.json();
      window.open(data.shareUrl, "_blank");
      toast({
        title: "Sucesso",
        description: "Projeto compartilhado no LinkedIn!",
      });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir projetos",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Login necessário", 
        description: "Você precisa estar logado para compartilhar projetos",
        variant: "destructive",
      });
      return;
    }
    shareMutation.mutate();
  };

  return (
    <>
      <Card
        className="glass-morphism rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 group cursor-pointer"
        onClick={() => setShowModal(true)}
        data-testid={`project-card-${project.id}`}
      >
        {project.imageUrl && (
          <img
            src={project.imageUrl}
            alt={`${project.title} project screenshot`}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            data-testid={`project-image-${project.id}`}
          />
        )}

        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="bg-primary/20 text-primary" data-testid={`project-category-${project.id}`}>
              {project.category}
            </Badge>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
              <span data-testid={`project-likes-${project.id}`}>{project.likes}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors" data-testid={`project-title-${project.id}`}>
            {project.title}
          </h3>
          <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`project-description-${project.id}`}>
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies?.slice(0, 3).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs" data-testid={`project-tech-${tech}-${project.id}`}>
                {tech}
              </Badge>
            ))}
            {project.technologies && project.technologies.length > 3 && (
              <Badge variant="secondary" className="text-xs" data-testid={`project-more-techs-${project.id}`}>
                +{project.technologies.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
              data-testid={`project-view-${project.id}`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver Projeto</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-red-400 hover:text-red-300' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`project-like-${project.id}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={shareMutation.isPending}
                className="flex items-center space-x-2 text-muted-foreground hover:text-accent transition-colors"
                data-testid={`project-share-${project.id}`}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <ProjectModal
          project={project}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
