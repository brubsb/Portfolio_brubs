import {
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Achievement,
  type InsertAchievement,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Tool,
  type InsertTool,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Projects
  getProjects(published?: boolean, featured?: boolean, limit?: number, offset?: number): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Achievements
  getAchievements(featured?: boolean, limit?: number, offset?: number): Promise<Achievement[]>;
  getAchievement(id: string): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, achievement: Partial<Achievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: string): Promise<boolean>;
  
  // Comments
  getComments(projectId?: string, achievementId?: string): Promise<(Comment & { user: Pick<User, 'id' | 'name' | 'avatar'> })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;
  
  // Likes
  toggleLike(like: InsertLike): Promise<{ liked: boolean; count: number }>;
  getUserLikes(userId: string): Promise<Like[]>;
  
  // Tools
  getTools(featured?: boolean, limit?: number, offset?: number): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, tool: Partial<Tool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private achievements: Map<string, Achievement>;
  private comments: Map<string, Comment>;
  private likes: Map<string, Like>;
  private tools: Map<string, Tool>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.achievements = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.tools = new Map();
    
    // Initialize admin user
    this.initializeAdminUser();
    this.initializeSampleData();
  }

  private async initializeAdminUser() {
    const hashedPassword = await bcrypt.hash("Escola00", 10);
    const adminUser: User = {
      id: randomUUID(),
      email: "brunabarbozasofia@gmail.com",
      password: hashedPassword,
      name: "Bruna Barboza",
      avatar: "/uploads/1758308814878-651921657.png",
      aboutPhoto: "/uploads/1758308814878-651921657.png",
      aboutText: "Olá! Sou Bruna Barboza, desenvolvedora full-stack e designer UI/UX com mais de 5 anos de experiência criando soluções digitais inovadoras. Minha paixão é transformar ideias complexas em experiências digitais intuitivas e impactantes.",
      aboutDescription: "Especializo-me em React, Node.js, e design de interfaces, sempre buscando as melhores práticas e tecnologias mais recentes para entregar resultados excepcionais aos meus clientes.",
      skills: ["React", "Node.js", "MongoDB", "TypeScript", "Figma", "AWS"],
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
    console.log('Admin user initialized:', { id: adminUser.id, email: adminUser.email, name: adminUser.name });
  }

  private initializeSampleData() {
    // Sample projects
    const sampleProjects: Project[] = [
      {
        id: randomUUID(),
        title: "E-commerce Platform",
        description: "Plataforma completa de e-commerce com dashboard administrativo, sistema de pagamentos e gestão de estoque.",
        fullDescription: "Plataforma completa de e-commerce desenvolvida com React e Node.js, featuring sistema completo de autenticação, carrinho de compras, processamento de pagamentos via Stripe, dashboard administrativo para gestão de produtos e pedidos, e sistema de avaliações de produtos.",
        category: "Web App",
        tags: ["React", "Node.js", "MongoDB", "Express", "Stripe API", "JWT"],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        videoUrl: null,
        demoUrl: "https://demo.example.com",
        githubUrl: "https://github.com/example/ecommerce",
        technologies: ["React", "Node.js", "MongoDB"],
        isPublished: true,
        isFeatured: true,
        likes: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "FinTech Mobile App",
        description: "Design e prototipação de aplicativo mobile para gestão financeira pessoal com interface intuitiva.",
        fullDescription: "Aplicativo mobile para gestão financeira pessoal desenvolvido com React Native, incluindo categorização automática de gastos, gráficos de análise financeira, metas de economia e integração com bancos.",
        category: "Mobile",
        tags: ["Figma", "React Native", "UI/UX"],
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=MnwxMajA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        videoUrl: null,
        demoUrl: "https://demo.example.com",
        githubUrl: null,
        technologies: ["React Native", "Figma"],
        isPublished: true,
        isFeatured: true,
        likes: 31,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Analytics Dashboard",
        description: "Dashboard interativo para análise de dados empresariais com visualizações avançadas e relatórios em tempo real.",
        fullDescription: "Dashboard completo para análise de dados empresariais com visualizações interativas, filtros avançados, relatórios automatizados e integração com múltiplas fontes de dados.",
        category: "Dashboard",
        tags: ["Vue.js", "D3.js", "Python"],
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        videoUrl: null,
        demoUrl: null,
        githubUrl: null,
        technologies: ["Vue.js", "D3.js", "Python"],
        isPublished: true,
        isFeatured: false,
        likes: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleProjects.forEach(project => {
      this.projects.set(project.id, project);
    });

    // Sample achievements
    const sampleAchievements: Achievement[] = [
      {
        id: randomUUID(),
        title: "Melhor UI/UX 2023",
        description: "Prêmio de melhor interface de usuário em competição nacional de design",
        icon: "trophy",
        date: new Date("2023-11-15"),
        isFeatured: true,
        likes: 12,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Certificação AWS",
        description: "AWS Solutions Architect Associate - Arquitetura de soluções na nuvem",
        icon: "code",
        date: new Date("2023-10-20"),
        isFeatured: true,
        likes: 8,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Speaker TechConf",
        description: "Palestrante principal sobre desenvolvimento full-stack moderno",
        icon: "users",
        date: new Date("2023-09-10"),
        isFeatured: false,
        likes: 15,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Mestrado em TI",
        description: "Mestrado em Tecnologia da Informação com foco em Inteligência Artificial",
        icon: "graduation-cap",
        date: new Date("2023-07-01"),
        isFeatured: false,
        likes: 22,
        createdAt: new Date(),
      },
    ];

    sampleAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });

    // Sample tools
    const sampleTools: Tool[] = [
      {
        id: randomUUID(),
        name: "React",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
        category: "Frontend",
        website: "https://reactjs.org",
        isFeatured: true,
        order: 1,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Node.js",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
        category: "Backend",
        website: "https://nodejs.org",
        isFeatured: true,
        order: 2,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "TypeScript",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
        category: "Language",
        website: "https://www.typescriptlang.org",
        isFeatured: true,
        order: 3,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "PostgreSQL",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
        category: "Database",
        website: "https://www.postgresql.org",
        isFeatured: true,
        order: 4,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Figma",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
        category: "Design",
        website: "https://www.figma.com",
        isFeatured: true,
        order: 5,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "AWS",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
        category: "Cloud",
        website: "https://aws.amazon.com",
        isFeatured: false,
        order: 6,
        createdAt: new Date(),
      },
    ];

    sampleTools.forEach(tool => {
      this.tools.set(tool.id, tool);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAdminUser(): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.isAdmin === true);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      avatar: insertUser.avatar || null,
      aboutPhoto: insertUser.aboutPhoto ?? null,
      aboutText: insertUser.aboutText ?? null,
      aboutDescription: insertUser.aboutDescription ?? null,
      skills: (insertUser.skills || []) as string[],
      id,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      ...updates,
      id: user.id, // Preserve ID
      createdAt: user.createdAt, // Preserve creation date
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getProjects(published?: boolean, featured?: boolean, limit?: number, offset?: number): Promise<Project[]> {
    let projects = Array.from(this.projects.values());
    
    if (published !== undefined) {
      projects = projects.filter(p => p.isPublished === published);
    }
    
    if (featured !== undefined) {
      projects = projects.filter(p => p.isFeatured === featured);
    }
    
    projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (offset) {
      projects = projects.slice(offset);
    }
    
    if (limit) {
      projects = projects.slice(0, limit);
    }
    
    return projects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      ...project,
      fullDescription: project.fullDescription || null,
      imageUrl: project.imageUrl || null,
      videoUrl: project.videoUrl || null,
      demoUrl: project.demoUrl || null,
      githubUrl: project.githubUrl || null,
      tags: (project.tags || []) as string[],
      technologies: (project.technologies || []) as string[],
      isPublished: project.isPublished ?? false,
      isFeatured: project.isFeatured ?? false,
      id,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = {
      ...project,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getAchievements(featured?: boolean, limit?: number, offset?: number): Promise<Achievement[]> {
    let achievements = Array.from(this.achievements.values());
    
    // Filter by featured if specified
    if (featured !== undefined) {
      achievements = achievements.filter((achievement: Achievement) => achievement.isFeatured === featured);
    }
    
    achievements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (offset) {
      achievements = achievements.slice(offset);
    }
    
    if (limit) {
      achievements = achievements.slice(0, limit);
    }
    
    return achievements;
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const newAchievement: Achievement = {
      ...achievement,
      id,
      isFeatured: achievement.isFeatured ?? false,
      likes: 0,
      createdAt: new Date(),
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement = {
      ...achievement,
      ...updates,
      id,
    };
    this.achievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  async deleteAchievement(id: string): Promise<boolean> {
    return this.achievements.delete(id);
  }

  async getComments(projectId?: string, achievementId?: string): Promise<(Comment & { user: Pick<User, 'id' | 'name' | 'avatar'> })[]> {
    let comments = Array.from(this.comments.values());
    
    if (projectId) {
      comments = comments.filter(c => c.projectId === projectId);
    }
    
    if (achievementId) {
      comments = comments.filter(c => c.achievementId === achievementId);
    }
    
    return comments.map(comment => {
      const user = this.users.get(comment.userId);
      return {
        ...comment,
        user: user ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        } : {
          id: comment.userId,
          name: 'Unknown User',
          avatar: null,
        }
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const newComment: Comment = {
      ...comment,
      projectId: comment.projectId || null,
      achievementId: comment.achievementId || null,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async toggleLike(like: InsertLike): Promise<{ liked: boolean; count: number }> {
    // Normalize null/undefined for proper comparison
    const normalizedProjectId = like.projectId || null;
    const normalizedAchievementId = like.achievementId || null;
    
    const existingLike = Array.from(this.likes.values()).find(
      l => l.userId === like.userId && 
           (l.projectId || null) === normalizedProjectId && 
           (l.achievementId || null) === normalizedAchievementId
    );

    if (existingLike) {
      // Unlike
      this.likes.delete(existingLike.id);
      
      // Update count
      if (like.projectId) {
        const project = this.projects.get(like.projectId);
        if (project) {
          project.likes = Math.max(0, project.likes - 1);
          this.projects.set(like.projectId, project);
        }
      }
      
      if (like.achievementId) {
        const achievement = this.achievements.get(like.achievementId);
        if (achievement) {
          achievement.likes = Math.max(0, achievement.likes - 1);
          this.achievements.set(like.achievementId, achievement);
        }
      }
      
      return { liked: false, count: this.getLikeCount(like.projectId || undefined, like.achievementId || undefined) };
    } else {
      // Like
      const id = randomUUID();
      const newLike: Like = {
        ...like,
        projectId: like.projectId || null,
        achievementId: like.achievementId || null,
        id,
        createdAt: new Date(),
      };
      this.likes.set(id, newLike);
      
      // Update count
      if (like.projectId) {
        const project = this.projects.get(like.projectId);
        if (project) {
          project.likes += 1;
          this.projects.set(like.projectId, project);
        }
      }
      
      if (like.achievementId) {
        const achievement = this.achievements.get(like.achievementId);
        if (achievement) {
          achievement.likes += 1;
          this.achievements.set(like.achievementId, achievement);
        }
      }
      
      return { liked: true, count: this.getLikeCount(like.projectId || undefined, like.achievementId || undefined) };
    }
  }

  private getLikeCount(projectId?: string, achievementId?: string): number {
    if (projectId) {
      const project = this.projects.get(projectId);
      return project ? project.likes : 0;
    }
    if (achievementId) {
      const achievement = this.achievements.get(achievementId);
      return achievement ? achievement.likes : 0;
    }
    return 0;
  }

  async getUserLikes(userId: string): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.userId === userId);
  }

  async getTools(featured?: boolean, limit?: number, offset?: number): Promise<Tool[]> {
    let tools = Array.from(this.tools.values());
    
    if (featured !== undefined) {
      tools = tools.filter(t => t.isFeatured === featured);
    }
    
    tools.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    
    if (offset) {
      tools = tools.slice(offset);
    }
    
    if (limit) {
      tools = tools.slice(0, limit);
    }
    
    return tools;
  }

  async getTool(id: string): Promise<Tool | undefined> {
    return this.tools.get(id);
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const id = randomUUID();
    const newTool: Tool = {
      ...tool,
      iconUrl: tool.iconUrl || null,
      category: tool.category || null,
      website: tool.website || null,
      isFeatured: tool.isFeatured ?? false,
      order: tool.order ?? 0,
      id,
      createdAt: new Date(),
    };
    this.tools.set(id, newTool);
    return newTool;
  }

  async updateTool(id: string, updates: Partial<Tool>): Promise<Tool | undefined> {
    const tool = this.tools.get(id);
    if (!tool) return undefined;
    
    const updatedTool = {
      ...tool,
      ...updates,
      id,
    };
    this.tools.set(id, updatedTool);
    return updatedTool;
  }

  async deleteTool(id: string): Promise<boolean> {
    return this.tools.delete(id);
  }
}

export const storage = new MemStorage();
