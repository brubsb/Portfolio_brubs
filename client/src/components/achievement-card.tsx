import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Achievement } from "@shared/schema";
import { authManager } from "@/lib/auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AchievementCardProps {
  achievement: Achievement;
}

const iconMap = {
  trophy: "🏆",
  code: "💻",
  users: "👥",
  "graduation-cap": "🎓",
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = authManager.isAuthenticated();

  const { data: userLikes = [] } = useQuery({
    queryKey: ["/api/likes/user"],
    enabled: isAuthenticated,
  });

  const isLiked = userLikes.some((like: any) => like.achievementId === achievement.id);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/likes/toggle", {
        achievementId: achievement.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/likes/user"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para curtir conquistas",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir conquistas",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  return (
    <Card className="glass-morphism rounded-xl p-6 text-center hover:scale-105 transition-all duration-300" data-testid={`achievement-card-${achievement.id}`}>
      <CardContent className="p-0">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl" data-testid={`achievement-icon-${achievement.id}`}>
            {iconMap[achievement.icon as keyof typeof iconMap] || "🏆"}
          </span>
        </div>
        
        <h3 className="text-lg font-bold mb-2" data-testid={`achievement-title-${achievement.id}`}>
          {achievement.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4" data-testid={`achievement-description-${achievement.id}`}>
          {achievement.description}
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <div className="text-sm text-muted-foreground" data-testid={`achievement-date-${achievement.id}`}>
            {new Date(achievement.date).toLocaleDateString('pt-BR', {
              month: 'short',
              year: 'numeric'
            })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? 'text-red-400 hover:text-red-300' : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`achievement-like-${achievement.id}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span data-testid={`achievement-likes-${achievement.id}`}>{achievement.likes}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
