import { useState } from "react";
import { ExternalLink, Github, Heart, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project } from "@shared/schema";
import { CommentSection } from "./comment-section";
import { authManager } from "@/lib/auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = authManager.isAuthenticated();

  const { data: userLikes = [] } = useQuery({
    queryKey: ["/api/likes/user"],
    enabled: isAuthenticated,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/comments", project.id],
    queryFn: () => apiRequest("GET", `/api/comments?projectId=${project.id}`).then(res => res.json()),
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
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/share/linkedin", {
        projectId: project.id,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      window.open(data.shareUrl, "_blank");
      toast({
        title: "Sucesso",
        description: "Projeto compartilhado no LinkedIn!",
      });
    },
  });

  const handleLike = () => {
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

  const handleShare = () => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto glass-morphism" data-testid="project-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" data-testid="project-modal-title">
            {project.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div>
            {project.imageUrl && (
              <img
                src={project.imageUrl}
                alt={`${project.title} showcase`}
                className="w-full rounded-xl mb-4"
                data-testid="project-modal-image"
              />
            )}

            <div className="flex gap-4">
              {project.demoUrl && (
                <Button
                  asChild
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80"
                  data-testid="project-demo-link"
                >
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Demo ao Vivo
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  data-testid="project-github-link"
                >
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    Código
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Descrição</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="project-modal-description">
                {project.fullDescription || project.description}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Tecnologias Utilizadas</h3>
              <div className="flex flex-wrap gap-2" data-testid="project-modal-technologies">
                {project.technologies?.map((tech) => (
                  <Badge key={tech} variant="outline" className="bg-primary/20 text-primary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6 mb-6">
              <Button
                variant="ghost"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-red-400 hover:text-red-300' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="project-modal-like"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{project.likes}</span>
              </Button>

              <div className="flex items-center space-x-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span data-testid="project-modal-comment-count">{comments.length}</span>
              </div>

              <Button
                variant="ghost"
                onClick={handleShare}
                disabled={shareMutation.isPending}
                className="flex items-center space-x-2 text-secondary hover:text-secondary/80 transition-colors"
                data-testid="project-modal-share"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar</span>
              </Button>
            </div>

            <CommentSection projectId={project.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
