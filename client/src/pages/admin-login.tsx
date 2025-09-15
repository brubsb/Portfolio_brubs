import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [credentials, setCredentials] = useState({
    email: "brunabarbozasofia@gmail.com", // Pre-fill admin email
    password: "",
  });

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (authManager.isAuthenticated() && authManager.isAdmin()) {
      setLocation('/admin/dashboard');
    }
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await response.json();
      
      if (!data.user.isAdmin) {
        toast({
          title: "Acesso negado",
          description: "Esta área é restrita a administradores",
          variant: "destructive",
        });
        return;
      }

      authManager.login(data);
      
      toast({
        title: "Login realizado",
        description: "Bem-vinda ao painel administrativo!",
      });

      setLocation('/admin/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="admin-login-page">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/20"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow"></div>

      <Card className="w-full max-w-md glass-morphism relative z-10" data-testid="admin-login-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
              alt="Admin Profile"
              className="w-16 h-16 rounded-full border-2 border-primary object-cover"
              data-testid="admin-login-avatar"
            />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="admin-login-title">
            Área Administrativa
          </CardTitle>
          <p className="text-muted-foreground" data-testid="admin-login-subtitle">
            Acesse o painel de controle do portfólio
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">E-mail</Label>
              <Input
                id="admin-email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="brunabarbozasofia@gmail.com"
                required
                data-testid="admin-email-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email do administrador: brunabarbozasofia@gmail.com
              </p>
            </div>

            <div>
              <Label htmlFor="admin-password">Senha</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  data-testid="admin-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3"
                  data-testid="admin-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Senha: Escola00
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
              disabled={isLoading}
              data-testid="admin-login-submit"
            >
              {isLoading ? "Entrando..." : "Acessar Dashboard"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-muted-foreground hover:text-foreground"
              data-testid="back-to-site-link"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao site
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-2">Credenciais de Administrador:</h4>
            <p className="text-xs text-muted-foreground mb-1">
              <strong>Email:</strong> brunabarbozasofia@gmail.com
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Senha:</strong> Escola00
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
