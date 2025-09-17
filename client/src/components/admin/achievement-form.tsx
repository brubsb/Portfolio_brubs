import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertAchievementSchema, Achievement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertAchievementSchema.extend({
  date: z.string().min(1, "Data é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

interface AchievementFormProps {
  achievement?: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

const iconOptions = [
  { value: "trophy", label: "🏆 Troféu" },
  { value: "code", label: "💻 Código" },
  { value: "users", label: "👥 Pessoas" },
  { value: "graduation-cap", label: "🎓 Graduação" },
  { value: "star", label: "⭐ Estrela" },
  { value: "award", label: "🏅 Prêmio" },
  { value: "certificate", label: "📜 Certificado" },
  { value: "rocket", label: "🚀 Foguete" },
];

export function AchievementForm({ achievement, isOpen, onClose }: AchievementFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "trophy",
      date: "",
    },
  });

  useEffect(() => {
    if (achievement) {
      form.reset({
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        date: new Date(achievement.date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        title: "",
        description: "",
        icon: "trophy",
        date: "",
      });
    }
  }, [achievement, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/achievements", {
        ...data,
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Conquista criada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Create achievement error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar conquista. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("PATCH", `/api/achievements/${achievement!.id}`, {
        ...data,
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Conquista atualizada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Update achievement error:', error);
      if (error.message.includes('403') || error.message.includes('401') || error.message.includes('Invalid or expired token')) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar conquista. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    if (achievement) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full glass-morphism" data-testid="achievement-form-modal">
        <DialogHeader>
          <DialogTitle data-testid="achievement-form-title">
            {achievement ? "Editar Conquista" : "Nova Conquista"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4"
            data-testid="achievement-form-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="achievement-title-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="achievement-icon-select">
                          <SelectValue placeholder="Selecione um ícone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} data-testid={`icon-option-${option.value}`}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="h-24" data-testid="achievement-description-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="achievement-date-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="achievement-form-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/80"
                data-testid="achievement-form-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : achievement ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
