import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertToolSchema, Tool, InsertTool } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { z } from "zod";

const formSchema = insertToolSchema.extend({
  iconUrl: z.string().default(""),
  category: z.string().default(""),
  website: z.string().default(""),
});

type FormData = z.infer<typeof formSchema>;

interface ToolFormProps {
  tool?: Tool | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ToolForm({ tool, isOpen, onClose }: ToolFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [iconFile, setIconFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      iconUrl: "",
      category: "",
      website: "",
      isFeatured: false,
      order: 0,
    },
  });

  useEffect(() => {
    if (tool) {
      form.reset({
        name: tool.name,
        iconUrl: tool.iconUrl || "",
        category: tool.category || "",
        website: tool.website || "",
        isFeatured: tool.isFeatured,
        order: tool.order,
      });
    } else {
      form.reset({
        name: "",
        iconUrl: "",
        category: "",
        website: "",
        isFeatured: false,
        order: 0,
      });
    }
  }, [tool, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });

      // Add icon file
      if (iconFile) {
        formData.append('icon', iconFile);
      }

      const authHeaders = authManager.getAuthHeaders();
      const headers = { ...authHeaders };
      delete headers["Content-Type"]; // Remove Content-Type for FormData

      const response = await fetch("/api/tools", {
        method: "POST",
        headers: headers,
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({
        title: "Sucesso",
        description: "Ferramenta criada com sucesso!",
      });
      onClose();
      form.reset();
      setIconFile(null);
    },
    onError: (error: any) => {
      console.error('Create tool error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        authManager.logout();
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar a ferramenta. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!tool) throw new Error("Tool is required for update");
      
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });

      // Add icon file
      if (iconFile) {
        formData.append('icon', iconFile);
      }

      const authHeaders = authManager.getAuthHeaders();
      const headers = { ...authHeaders };
      delete headers["Content-Type"]; // Remove Content-Type for FormData

      const response = await fetch(`/api/tools/${tool.id}`, {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({
        title: "Sucesso",
        description: "Ferramenta atualizada com sucesso!",
      });
      onClose();
      setIconFile(null);
    },
    onError: (error: any) => {
      console.error('Update tool error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        authManager.logout();
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a ferramenta. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    if (tool) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIconFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="tool-form-dialog">
        <DialogHeader>
          <DialogTitle data-testid="tool-form-title">
            {tool ? "Editar Ferramenta" : "Nova Ferramenta"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Ferramenta</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="React, TypeScript, etc." 
                      {...field} 
                      data-testid="tool-name-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon Upload */}
            <div className="space-y-2">
              <Label>Ícone da Ferramenta</Label>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="cursor-pointer"
                  data-testid="tool-icon-upload"
                />
                {iconFile && (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      {iconFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Icon URL (alternative to file upload) */}
            <FormField
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Ícone (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://cdn.jsdelivr.net/gh/devicons/..." 
                      {...field}
                      data-testid="tool-icon-url-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Frontend, Backend, Database, etc." 
                      {...field}
                      data-testid="tool-category-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://reactjs.org" 
                      {...field}
                      data-testid="tool-website-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order */}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="tool-order-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured */}
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Ferramenta em Destaque
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Exibir esta ferramenta no carrossel da página inicial
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="tool-featured-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="tool-form-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="tool-form-submit"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : tool ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}