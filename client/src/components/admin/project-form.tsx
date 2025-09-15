import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertProjectSchema, Project, InsertProject } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertProjectSchema.extend({
  tags: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  fullDescription: z.string().default(""),
  demoUrl: z.string().default(""),
  githubUrl: z.string().default(""),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectForm({ project, isOpen, onClose }: ProjectFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentTag, setCurrentTag] = useState("");
  const [currentTech, setCurrentTech] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      fullDescription: "",
      category: "",
      tags: [],
      technologies: [],
      imageUrl: "",
      videoUrl: "",
      demoUrl: "",
      githubUrl: "",
      isPublished: false,
      isFeatured: false,
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        description: project.description,
        fullDescription: project.fullDescription || "",
        category: project.category,
        tags: project.tags || [],
        technologies: project.technologies || [],
        imageUrl: project.imageUrl || "",
        videoUrl: project.videoUrl || "",
        demoUrl: project.demoUrl || "",
        githubUrl: project.githubUrl || "",
        isPublished: project.isPublished,
        isFeatured: project.isFeatured || false,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        fullDescription: "",
        category: "",
        tags: [],
        technologies: [],
        imageUrl: "",
        videoUrl: "",
        demoUrl: "",
        githubUrl: "",
        isPublished: false,
        isFeatured: false,
      });
    }
  }, [project, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'tags' || key === 'technologies') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value?.toString() || '');
        }
      });

      // Add files
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar projeto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'tags' || key === 'technologies') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value?.toString() || '');
        }
      });

      // Add files
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await fetch(`/api/projects/${project!.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar projeto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (project) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addTag = () => {
    if (currentTag.trim()) {
      const currentTags = form.getValues('tags');
      if (!currentTags.includes(currentTag.trim())) {
        form.setValue('tags', [...currentTags, currentTag.trim()]);
        setCurrentTag("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addTechnology = () => {
    if (currentTech.trim()) {
      const currentTechs = form.getValues('technologies');
      if (!currentTechs.includes(currentTech.trim())) {
        form.setValue('technologies', [...currentTechs, currentTech.trim()]);
        setCurrentTech("");
      }
    }
  };

  const removeTechnology = (techToRemove: string) => {
    const currentTechs = form.getValues('technologies');
    form.setValue('technologies', currentTechs.filter(tech => tech !== techToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto glass-morphism" data-testid="project-form-modal">
        <DialogHeader>
          <DialogTitle data-testid="project-form-title">
            {project ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4"
            data-testid="project-form-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="project-title-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Web App, Mobile, Dashboard..." data-testid="project-category-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="h-24" data-testid="project-description-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Completa</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="h-32" data-testid="project-full-description-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Links and Media */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Demo</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" data-testid="project-demo-url-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do GitHub</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" data-testid="project-github-url-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label htmlFor="image-upload">Imagem do Projeto</Label>
                  <div className="mt-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      data-testid="project-image-input"
                    />
                    {project?.imageUrl && !imageFile && (
                      <img src={project.imageUrl} alt="Current" className="mt-2 w-32 h-20 object-cover rounded" />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="video-upload">Vídeo do Projeto</Label>
                  <div className="mt-2">
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      data-testid="project-video-input"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Publicado</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Projeto visível no site público
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="project-published-switch"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Projeto em Destaque</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Projeto aparece na página inicial como principal
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="project-featured-switch"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Adicionar tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  data-testid="project-tag-input"
                />
                <Button type="button" onClick={addTag} data-testid="add-tag-button">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2" data-testid="project-tags-list">
                {form.watch('tags').map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div>
              <Label>Tecnologias</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={currentTech}
                  onChange={(e) => setCurrentTech(e.target.value)}
                  placeholder="Adicionar tecnologia..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  data-testid="project-technology-input"
                />
                <Button type="button" onClick={addTechnology} data-testid="add-technology-button">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2" data-testid="project-technologies-list">
                {form.watch('technologies').map((tech) => (
                  <Badge key={tech} variant="secondary" className="cursor-pointer" onClick={() => removeTechnology(tech)}>
                    {tech} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="project-form-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/80"
                data-testid="project-form-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : project ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
