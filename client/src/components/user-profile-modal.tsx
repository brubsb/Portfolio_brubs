import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(authManager.getUser()?.name || "");
  const { toast } = useToast();
  const user = authManager.getUser();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const authHeaders = authManager.getAuthHeaders();
      delete (authHeaders as any)["Content-Type"];

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: authHeaders,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const currentToken = authManager.getToken();
      if (currentToken) {
        authManager.login({ token: currentToken, user: data.user });
      }

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      });

      window.location.reload();
    } catch (error: any) {
      console.error('Update avatar error:', error);
      if (error.message.includes('403') || error.message.includes('401')) {
        toast({
          title: "Sessao expirada",
          description: "Faca login novamente para continuar.",
          variant: "destructive",
        });
        authManager.logout();
        window.location.reload();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar foto de perfil. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome nao pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const authHeaders = authManager.getAuthHeaders();

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const currentToken = authManager.getToken();
      if (currentToken) {
        authManager.login({ token: currentToken, user: data.user });
      }

      toast({
        title: "Sucesso",
        description: "Nome atualizado com sucesso!",
      });

      window.location.reload();
    } catch (error: any) {
      console.error('Update name error:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar nome. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-morphism" data-testid="user-profile-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" data-testid="user-profile-modal-title">
            Meu Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <img
                src={user?.avatar || "/uploads/default-avatar.png"}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full border-4 border-primary object-cover"
                data-testid="user-profile-avatar"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  data-testid="user-avatar-upload"
                  disabled={isUploading}
                />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-primary bg-opacity-50 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white animate-pulse" />
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Clique na foto para alterar
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                data-testid="user-profile-name-input"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
                data-testid="user-profile-email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O email nao pode ser alterado.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="user-profile-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateName}
              disabled={isUploading || name === user?.name}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80"
              data-testid="user-profile-save"
            >
              {isUploading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
