import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ToolForm } from "@/components/admin/tool-form";
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
  Camera,
  Upload,
  Save,
} from "lucide-react";
import { Project, Achievement, Comment, Tool } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [showToolForm, setShowToolForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'comments' | 'profile'>('dashboard');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'project' | 'achievement' | 'comment' | 'tool';
    id: string;
    title: string;
  } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aboutPhotoFile, setAboutPhotoFile] = useState<File | null>(null);
  const [isUploadingAboutPhoto, setIsUploadingAboutPhoto] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [aboutDescription, setAboutDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isUpdatingAbout, setIsUpdatingAbout] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (!authManager.isAuthenticated() || !authManager.isAdmin()) {
      setLocation('/admin');
      return;
    }
  }, [setLocation]);

  // Load current user data into form fields
  useEffect(() => {
    const user = authManager.getUser();
    if (user) {
      setAboutText(user.aboutText || '');
      setAboutDescription(user.aboutDescription || '');
      setSkills(user.skills || []);
    }
  }, []);

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

  const { data: tools = [] } = useQuery({
    queryKey: ["/api/tools"],
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

  const deleteToolMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Ferramenta excluída com sucesso!",
      });
      setDeleteConfirmation(null);
    },
    onError: (error: any) => {
      console.error('Delete tool error:', error);
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
          description: "Não foi possível excluir a ferramenta. Tente novamente.",
          variant: "destructive",
        });
      }
      setDeleteConfirmation(null);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (avatarFile: File) => {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const authHeaders = authManager.getAuthHeaders();
      const headers = { ...authHeaders };
      delete headers["Content-Type"]; // Remove Content-Type for FormData

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: headers,
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update auth manager with new user data
      const currentToken = authManager.getToken();
      if (currentToken) {
        authManager.login({ token: currentToken, user: data.user });
      }
      
      // Invalidate profile query for public pages
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      });
      setAvatarFile(null);
      setIsUploading(false);
    },
    onError: (error: any) => {
      console.error('Update avatar error:', error);
      setIsUploading(false);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
        authManager.logout();
        setLocation('/admin');
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar foto de perfil. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const updateAboutInfoMutation = useMutation({
    mutationFn: async (data: { aboutText: string; aboutDescription: string; skills: string[] }) => {
      return apiRequest("PATCH", "/api/user/about", data);
    },
    onSuccess: (data) => {
      // Update auth manager with new user data
      const currentToken = authManager.getToken();
      if (currentToken) {
        authManager.login({ token: currentToken, user: data.user });
      }
      
      // Invalidate profile query for public pages
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso!",
      });
      setIsUpdatingAbout(false);
    },
    onError: (error: any) => {
      console.error('Update about info error:', error);
      setIsUpdatingAbout(false);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
        authManager.logout();
        setLocation('/admin');
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar informações. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const updateAboutPhotoMutation = useMutation({
    mutationFn: async (aboutPhotoFile: File) => {
      const formData = new FormData();
      formData.append('aboutPhoto', aboutPhotoFile);

      const authHeaders = authManager.getAuthHeaders();
      const headers = { ...authHeaders };
      delete headers["Content-Type"]; // Remove Content-Type for FormData

      const response = await fetch("/api/user/about-photo", {
        method: "PATCH",
        headers: headers,
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the user data in localStorage
      if (data.user) {
        authManager.login({
          token: authManager.getToken() || '',
          user: data.user
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
      toast({
        title: "Sucesso",
        description: "Foto 'sobre mim' atualizada com sucesso!",
      });
      setAboutPhotoFile(null);
      setIsUploadingAboutPhoto(false);
    },
    onError: (error: any) => {
      console.error('Update about photo error:', error);
      setIsUploadingAboutPhoto(false);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
        authManager.logout();
        setLocation('/admin');
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar foto 'sobre mim'. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setIsUploading(true);
      updateProfileMutation.mutate(file);
    }
  };

  const handleAboutPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAboutPhotoFile(file);
      setIsUploadingAboutPhoto(true);
      updateAboutPhotoMutation.mutate(file);
    }
  };

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

  const handleDeleteTool = (tool: Tool) => {
    setDeleteConfirmation({
      type: 'tool',
      id: tool.id,
      title: tool.name,
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
    } else if (deleteConfirmation.type === 'tool') {
      deleteToolMutation.mutate(deleteConfirmation.id);
    }
  };

  const handleLogout = () => {
    authManager.logout();
    setLocation('/');
  };

  const handleUpdateAboutInfo = () => {
    setIsUpdatingAbout(true);
    updateAboutInfoMutation.mutate({ aboutText, aboutDescription, skills });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
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
            <div className="relative group">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                alt="Admin Profile"
                className="w-12 h-12 rounded-full border-2 border-primary object-cover"
                data-testid="admin-profile-image"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  data-testid="avatar-upload-input"
                  disabled={isUploading}
                />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-primary bg-opacity-50 rounded-full flex items-center justify-center">
                  <Upload className="h-4 w-4 text-white animate-pulse" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold" data-testid="admin-profile-name">{user?.name || 'Admin'}</h3>
              <p className="text-sm text-muted-foreground">Administrador</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeSection === 'dashboard' ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection('dashboard')}
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
              variant={activeSection === 'comments' ? "secondary" : "ghost"}
              className="w-full justify-start relative"
              onClick={() => {
                setActiveSection('comments');
                setNewCommentsCount(0); // Reset notification count when viewing comments
              }}
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
            <Button
              variant={activeSection === 'profile' ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection('profile')}
              data-testid="nav-profile"
            >
              <User className="mr-3 h-4 w-4" />
              Perfil
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
            <h1 className="text-3xl font-bold" data-testid="dashboard-title">
              {activeSection === 'comments' ? 'Comentários' : 
               activeSection === 'profile' ? 'Perfil' : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground" data-testid="dashboard-subtitle">
              {activeSection === 'comments' 
                ? 'Gerencie todos os comentários dos seus projetos e conquistas'
                : activeSection === 'profile'
                ? 'Gerencie suas informações pessoais, fotos, texto "sobre mim" e tecnologias'
                : `Bem-vinda de volta, ${user?.name}!`
              }
            </p>
          </div>
        </div>

        {activeSection === 'profile' ? (
          <Card className="glass-morphism max-w-2xl">
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                    alt="Foto de Perfil"
                    className="w-24 h-24 rounded-full border-4 border-primary object-cover"
                    data-testid="profile-avatar-large"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      data-testid="profile-avatar-upload"
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-primary bg-opacity-50 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-white animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold" data-testid="profile-name">{user?.name}</h3>
                  <p className="text-muted-foreground" data-testid="profile-email">{user?.email}</p>
                  <Badge className="bg-primary/20 text-primary">Administrador</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Alterar Foto de Perfil</h4>
                <p className="text-sm text-muted-foreground">
                  Clique na sua foto de perfil acima ou use o botão abaixo para fazer upload de uma nova imagem. 
                  Esta foto será exibida em todo o seu portfólio.
                </p>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => document.getElementById('profile-file-input')?.click()}
                    disabled={isUploading}
                    className="bg-primary text-primary-foreground hover:bg-primary/80"
                    data-testid="upload-avatar-button"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Carregando...' : 'Escolher Nova Foto'}
                  </Button>
                  <input
                    id="profile-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <span className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG, GIF (máx. 50MB)
                  </span>
                </div>
              </div>

              <Separator />

              {/* About Photo Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Foto "Sobre Mim"</h4>
                <p className="text-sm text-muted-foreground">
                  Esta foto aparece na seção "sobre mim" da página inicial e outras páginas do portfólio.
                </p>
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <img
                      src={user?.aboutPhoto || "/uploads/1758308814878-651921657.png"}
                      alt="Foto Sobre Mim"
                      className="w-32 h-40 rounded-2xl border-4 border-primary object-cover"
                      data-testid="about-photo-preview"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAboutPhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        data-testid="about-photo-upload"
                        disabled={isUploadingAboutPhoto}
                      />
                    </div>
                    {isUploadingAboutPhoto && (
                      <div className="absolute inset-0 bg-primary bg-opacity-50 rounded-2xl flex items-center justify-center">
                        <Upload className="h-6 w-6 text-white animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Button 
                      onClick={() => document.getElementById('about-photo-file-input')?.click()}
                      disabled={isUploadingAboutPhoto}
                      className="bg-primary text-primary-foreground hover:bg-primary/80"
                      data-testid="upload-about-photo-button"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingAboutPhoto ? 'Carregando...' : 'Alterar Foto "Sobre Mim"'}
                    </Button>
                    <input
                      id="about-photo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAboutPhotoUpload}
                      className="hidden"
                      disabled={isUploadingAboutPhoto}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Formatos aceitos: JPG, PNG, GIF (máx. 50MB)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* About Text Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Texto "Sobre Mim"</h4>
                <p className="text-sm text-muted-foreground">
                  Edite o texto principal e descrição que aparecem na seção "sobre mim" de todas as páginas.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Texto Principal</label>
                    <Textarea
                      value={aboutText}
                      onChange={(e) => setAboutText(e.target.value)}
                      placeholder="Texto principal da seção sobre mim..."
                      className="mt-1"
                      rows={3}
                      data-testid="about-text-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={aboutDescription}
                      onChange={(e) => setAboutDescription(e.target.value)}
                      placeholder="Descrição adicional..."
                      className="mt-1"
                      rows={2}
                      data-testid="about-description-input"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Skills Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Principais Tecnologias</h4>
                <p className="text-sm text-muted-foreground">
                  Gerencie as tecnologias que aparecem na seção "sobre mim" e em outras partes do portfólio.
                </p>
                
                {/* Current Skills */}
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {skill}
                      <Button
                        onClick={() => handleRemoveSkill(skill)}
                        size="sm"
                        variant="ghost"
                        className="h-auto p-1 ml-1 hover:bg-red-500 hover:text-white"
                        data-testid={`remove-skill-${skill}`}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* Add New Skill */}
                <div className="flex space-x-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Nova tecnologia..."
                    className="flex-1"
                    data-testid="new-skill-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <Button 
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim() || skills.includes(newSkill.trim())}
                    data-testid="add-skill-button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleUpdateAboutInfo}
                  disabled={isUpdatingAbout}
                  className="bg-primary text-primary-foreground hover:bg-primary/80"
                  data-testid="save-about-info-button"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingAbout ? 'Salvando...' : 'Salvar Informações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : activeSection === 'dashboard' ? (
          <>
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
                      <p className="text-2xl font-bold" data-testid="stats-total-comments">{stats.totalComments || comments.length}</p>
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
                  <TabsTrigger value="tools" data-testid="tools-tab">Ferramentas</TabsTrigger>
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
                  <Button
                    onClick={() => setShowToolForm(true)}
                    variant="outline"
                    data-testid="new-tool-button"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Ferramenta
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

              <TabsContent value="tools">
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle>Ferramentas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tools.length === 0 ? (
                      <div className="text-center py-8" data-testid="no-tools-message">
                        <p className="text-muted-foreground">Nenhuma ferramenta encontrada.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="tools-grid">
                        {tools.map((tool: Tool) => (
                          <Card key={tool.id} className="glass-morphism" data-testid={`tool-card-${tool.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  {tool.iconUrl ? (
                                    <img
                                      src={tool.iconUrl}
                                      alt={`${tool.name} icon`}
                                      className="w-8 h-8 object-contain"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center text-primary font-bold text-sm">
                                      {tool.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <h3 className="font-bold" data-testid={`tool-title-${tool.id}`}>{tool.name}</h3>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingTool(tool);
                                      setShowToolForm(true);
                                    }}
                                    data-testid={`edit-tool-${tool.id}`}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteTool(tool)}
                                    disabled={deleteToolMutation.isPending}
                                    data-testid={`delete-tool-${tool.id}`}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              {tool.category && (
                                <Badge variant="secondary" className="text-xs mb-2">
                                  {tool.category}
                                </Badge>
                              )}
                              {tool.website && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  <a href={tool.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {tool.website}
                                  </a>
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Ordem: {tool.order}</span>
                                <span>{tool.isFeatured ? "Destaque" : "Padrão"}</span>
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
          </>
        ) : (
          /* Comments Section */
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Todos os Comentários ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-8" data-testid="no-comments-message">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum comentário encontrado.</p>
                </div>
              ) : (
                <div className="space-y-4" data-testid="comments-list">
                  {comments.map((comment: Comment & { user: { name: string; avatar?: string } }) => {
                    const relatedProject = projects.find(p => p.id === comment.projectId);
                    const relatedAchievement = achievements.find(a => a.id === comment.achievementId);
                    
                    return (
                      <Card key={comment.id} className="border border-border/50" data-testid={`comment-card-${comment.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <img
                                src={comment.user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"}
                                alt={comment.user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
                                    {comment.user.name}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm mb-2" data-testid={`comment-content-${comment.id}`}>
                                  {comment.content}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                  Comentário em: {' '}
                                  <span className="font-medium">
                                    {relatedProject ? `Projeto "${relatedProject.title}"` : 
                                     relatedAchievement ? `Conquista "${relatedAchievement.title}"` : 
                                     'Item removido'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment)}
                              disabled={deleteCommentMutation.isPending}
                              className="flex-shrink-0"
                              data-testid={`delete-comment-${comment.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
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

      {showToolForm && (
        <ToolForm
          tool={editingTool}
          isOpen={showToolForm}
          onClose={() => {
            setShowToolForm(false);
            setEditingTool(null);
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
