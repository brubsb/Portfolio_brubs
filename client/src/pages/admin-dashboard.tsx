import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { ProjectForm } from "@/components/admin/project-form";
import { AchievementForm } from "@/components/admin/achievement-form";
import {
  BarChart3,
  FolderOpen,
  Trophy,
  MessageCircle,
  User,
  LogOut,
  Plus,
  Edit,
  Eye,
  Trash2,
  ArrowLeft,
  Heart,
  Bell,
} from "lucide-react";
import { Project, Achievement, Comment } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'comments'>('dashboard');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'project' | 'achievement' | 'comment';
    id: string;
    title: string;
  } | null>(null);

  // Check admin authentication
  useEffect(() => {
    if (!authManager.isAuthenticated() || !authManager.isAdmin()) {
      setLocation('/admin');
      return;
    }
  }, [setLocation]);

  // Handle real-time notifications
  useEffect(() => {
    if (lastMessage?.type === 'new_comment') {
      setNewCommentsCount(prev => prev + 1);
      toast({
        title: "Novo comentário",
        description: "Um novo comentário foi adicionado!",
      });
    }
  }, [lastMessage, toast]);

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: authManager.isAdmin(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: authManager.isAdmin(),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements"],
    enabled: authManager.isAdmin(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/comments"],
    enabled: authManager.isAdmin(),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso!",
      });
      setDeleteConfirmation(null);
    },
    onError: (error: any) => {
      console.error('Delete project error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        authManager.logout();
        setLocation('/admin');
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o projeto. Tente novamente.",
          variant: "destructive",
        });
      }
      setDeleteConfirmation(null);
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/achievements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Conquista excluída com sucesso!",
      });
      setDeleteConfirmation(null);
    },
    onError: (error: any) => {
      console.error('Delete achievement error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        authManager.logout();
        setLocation('/admin');
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a conquista. Tente novamente.",
          variant: "destructive",
        });
      }
      setDeleteConfirmation(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/comments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Comentário excluído com sucesso!",
      });
      setDeleteConfirmation(null);
    },
    onError: (error: any) => {
      console.error('Delete comment error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        authManager.logout();
        setLocation('/admin');
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o comentário. Tente novamente.",
          variant: "destructive",
        });
      }
      setDeleteConfirmation(null);
    },
  });

  const handleDeleteProject = (project: Project) => {
    setDeleteConfirmation({
      type: 'project',
      id: project.id,
      title: project.title,
    });
  };

  const handleDeleteAchievement = (achievement: Achievement) => {
    setDeleteConfirmation({
      type: 'achievement',
      id: achievement.id,
      title: achievement.title,
    });
  };

  const handleDeleteComment = (comment: Comment & { user: { name: string } }) => {
    setDeleteConfirmation({
      type: 'comment',
      id: comment.id,
      title: `comentário de ${comment.user.name}`,
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    
    if (deleteConfirmation.type === 'project') {
      deleteProjectMutation.mutate(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'achievement') {
      deleteAchievementMutation.mutate(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'comment') {
      deleteCommentMutation.mutate(deleteConfirmation.id);
    }
  };

  const handleLogout = () => {
    authManager.logout();
    setLocation('/');
  };

  const user = authManager.getUser();

  if (!authManager.isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <nav className="w-64 bg-card border-r border-border flex flex-col" data-testid="admin-sidebar">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
              alt="Admin Profile"
              className="w-12 h-12 rounded-full border-2 border-primary object-cover"
              data-testid="admin-profile-image"
            />
            <div>
              <h3 className="font-bold" data-testid="admin-profile-name">{user?.name || 'Admin'}</h3>
              <p className="text-sm text-muted-foreground">Administrador</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              data-testid="nav-dashboard"
            >
              <BarChart3 className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowProjectForm(true)}
              data-testid="nav-projects"
            >
              <FolderOpen className="mr-3 h-4 w-4" />
              Projetos
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowAchievementForm(true)}
              data-testid="nav-achievements"
            >
              <Trophy className="mr-3 h-4 w-4" />
              Conquistas
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start relative"
              data-testid="nav-comments"
            >
              <MessageCircle className="mr-3 h-4 w-4" />
              Comentários
              {newCommentsCount > 0 && (
                <div className="notification-dot w-2 h-2 rounded-full absolute right-2 top-2" data-testid="notification-dot">
                  <span className="sr-only">{newCommentsCount} novos comentários</span>
                </div>
              )}
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="w-full justify-start text-muted-foreground hover:text-foreground mb-2"
            data-testid="back-to-site"
          >
            <ArrowLeft className="mr-3 h-4 w-4" />
            Voltar ao Site
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            data-testid="logout-button"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground" data-testid="dashboard-subtitle">
              Bem-vinda de volta, {user?.name}!
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
                  <p className="text-2xl font-bold" data-testid="stats-total-projects">{stats.totalProjects || projects.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Curtidas</p>
                  <p className="text-2xl font-bold" data-testid="stats-total-likes">{stats.totalLikes || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-400/20 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comentários</p>
                  <p className="text-2xl font-bold" data-testid="stats-total-comments">{stats.totalComments || 0}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conquistas</p>
                  <p className="text-2xl font-bold" data-testid="stats-total-achievements">{stats.totalAchievements || achievements.length}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="projects" data-testid="projects-tab">Projetos</TabsTrigger>
              <TabsTrigger value="achievements" data-testid="achievements-tab">Conquistas</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowProjectForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/80"
                data-testid="new-project-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
              <Button
                onClick={() => setShowAchievementForm(true)}
                variant="outline"
                data-testid="new-achievement-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conquista
              </Button>
            </div>
          </div>

          <TabsContent value="projects">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Projetos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8" data-testid="no-projects-message">
                    <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="projects-table">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Projeto</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Curtidas</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project: Project) => (
                          <tr key={project.id} className="border-b border-border/50 hover:bg-muted/20" data-testid={`project-row-${project.id}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {project.imageUrl && (
                                  <img
                                    src={project.imageUrl}
                                    alt="Project thumbnail"
                                    className="w-10 h-8 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium" data-testid={`project-title-${project.id}`}>{project.title}</p>
                                  <p className="text-sm text-muted-foreground">{project.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={project.isPublished ? "default" : "secondary"}
                                className={project.isPublished ? "bg-green-400/20 text-green-400" : "bg-yellow-400/20 text-yellow-400"}
                                data-testid={`project-status-${project.id}`}
                              >
                                {project.isPublished ? "Publicado" : "Rascunho"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4" data-testid={`project-likes-${project.id}`}>{project.likes}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingProject(project);
                                    setShowProjectForm(true);
                                  }}
                                  data-testid={`edit-project-${project.id}`}
                                >
                                  <Edit className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteProject(project)}
                                  disabled={deleteProjectMutation.isPending}
                                  data-testid={`delete-project-${project.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="glass-morphism">
              <CardHeader>
                <CardTitle>Conquistas</CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <div className="text-center py-8" data-testid="no-achievements-message">
                    <p className="text-muted-foreground">Nenhuma conquista encontrada.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="achievements-grid">
                    {achievements.map((achievement: Achievement) => (
                      <Card key={achievement.id} className="glass-morphism" data-testid={`achievement-card-${achievement.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold" data-testid={`achievement-title-${achievement.id}`}>{achievement.title}</h3>
                            <div className="flex space-x-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingAchievement(achievement);
                                  setShowAchievementForm(true);
                                }}
                                data-testid={`edit-achievement-${achievement.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteAchievement(achievement)}
                                disabled={deleteAchievementMutation.isPending}
                                data-testid={`delete-achievement-${achievement.id}`}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(achievement.date).toLocaleDateString('pt-BR')}</span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {achievement.likes}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          isOpen={showProjectForm}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      )}

      {showAchievementForm && (
        <AchievementForm
          achievement={editingAchievement}
          isOpen={showAchievementForm}
          onClose={() => {
            setShowAchievementForm(false);
            setEditingAchievement(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <AlertDialogContent data-testid="delete-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir {deleteConfirmation?.type === 'project' ? 'o projeto' : 'a conquista'} 
              "<strong>{deleteConfirmation?.title}</strong>"?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteProjectMutation.isPending || deleteAchievementMutation.isPending}
              data-testid="cancel-delete"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteProjectMutation.isPending || deleteAchievementMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete"
            >
              {(deleteProjectMutation.isPending || deleteAchievementMutation.isPending) ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
