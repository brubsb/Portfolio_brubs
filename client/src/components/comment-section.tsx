import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { authManager } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommentSectionProps {
  projectId?: string;
  achievementId?: string;
}

export function CommentSection({ projectId, achievementId }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isAuthenticated = authManager.isAuthenticated();
  const user = authManager.getUser();

  const queryParams = new URLSearchParams();
  if (projectId) queryParams.append('projectId', projectId);
  if (achievementId) queryParams.append('achievementId', achievementId);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/comments", { projectId, achievementId }],
    queryFn: () => apiRequest("GET", `/api/comments?${queryParams}`).then(res => res.json()),
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/comments", {
        content,
        projectId,
        achievementId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setCommentText("");
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar",
        variant: "destructive",
      });
      return;
    }

    commentMutation.mutate(commentText);
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Carregando comentários...</div>;
  }

  return (
    <div data-testid="comment-section">
      <h3 className="text-lg font-bold mb-4" data-testid="comment-section-title">
        Comentários ({comments.length})
      </h3>

      {isAuthenticated ? (
        <Card className="mb-6 glass-morphism">
          <CardContent className="p-4">
            <form onSubmit={handleSubmitComment} className="flex space-x-3">
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                  data-testid="comment-form-avatar"
                />
              )}
              <div className="flex-1">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicione seu comentário..."
                  className="resize-none h-20 bg-input border-border"
                  data-testid="comment-input"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    type="submit"
                    disabled={commentMutation.isPending || !commentText.trim()}
                    size="sm"
                    data-testid="comment-submit"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {commentMutation.isPending ? "Enviando..." : "Comentar"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 glass-morphism">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground" data-testid="comment-login-prompt">
              Faça login para deixar um comentário
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4" data-testid="comment-list">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8" data-testid="no-comments">
            Ainda não há comentários. Seja o primeiro a comentar!
          </div>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
              {comment.user?.avatar && (
                <img
                  src={comment.user.avatar}
                  alt={comment.user.name}
                  className="w-10 h-10 rounded-full"
                  data-testid={`comment-avatar-${comment.id}`}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium" data-testid={`comment-author-${comment.id}`}>
                    {comment.user?.name || 'Usuário Anônimo'}
                  </span>
                  <span className="text-sm text-muted-foreground" data-testid={`comment-date-${comment.id}`}>
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground" data-testid={`comment-content-${comment.id}`}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
