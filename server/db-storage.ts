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
  users,
  projects,
  achievements,
  comments,
  likes,
  tools,
} from "@shared/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    const existingAdmin = await this.getUserByEmail("brunabarbozasofia@gmail.com");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Escola00", 10);
      const id = randomUUID();
      await db.insert(users).values({
        id,
        email: "brunabarbozasofia@gmail.com",
        password: hashedPassword,
        name: "Bruna Barboza",
        avatar: "/uploads/1758308814878-651921657.png",
        aboutPhoto: "/uploads/1758308814878-651921657.png",
        aboutText: "Olá! Sou Bruna Barboza, desenvolvedora full-stack e designer UI/UX com mais de 5 anos de experiência criando soluções digitais inovadoras. Minha paixão é transformar ideias complexas em experiências digitais intuitivas e impactantes.",
        aboutDescription: "Especializo-me em React, Node.js, e design de interfaces, sempre buscando as melhores práticas e tecnologias mais recentes para entregar resultados excepcionais aos meus clientes.",
        heroSubtitle: "Desenvolvedora Full Stack e Designer UI/UX apaixonada por criar experiências digitais memoráveis",
        skills: ["React", "Node.js", "MongoDB", "TypeScript", "Figma", "AWS"],
        isAdmin: true,
      });
      console.log('Admin user initialized in database');
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getAdminUser(): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const result = await db.insert(users).values({
      id,
      email: insertUser.email,
      name: insertUser.name,
      password: hashedPassword,
      avatar: insertUser.avatar || null,
      aboutPhoto: insertUser.aboutPhoto || null,
      aboutText: insertUser.aboutText || null,
      aboutDescription: insertUser.aboutDescription || null,
      heroSubtitle: insertUser.heroSubtitle || null,
      skills: insertUser.skills || [],
      isAdmin: false,
    }).returning();
    
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const { id: _, createdAt: __, ...updateData } = updates as any;
    
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  async getProjects(published?: boolean, featured?: boolean, limit?: number, offset?: number): Promise<Project[]> {
    let query = db.select().from(projects);
    
    const conditions = [];
    if (published !== undefined) {
      conditions.push(eq(projects.isPublished, published));
    }
    if (featured !== undefined) {
      conditions.push(eq(projects.isFeatured, featured));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(projects.createdAt)) as any;
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    if (offset) {
      query = query.offset(offset) as any;
    }
    
    return await query;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const result = await db.insert(projects).values({
      id,
      title: project.title,
      description: project.description,
      category: project.category,
      fullDescription: project.fullDescription || null,
      imageUrl: project.imageUrl || null,
      videoUrl: project.videoUrl || null,
      demoUrl: project.demoUrl || null,
      githubUrl: project.githubUrl || null,
      tags: project.tags || [],
      technologies: project.technologies || [],
      isPublished: project.isPublished ?? false,
      isFeatured: project.isFeatured ?? false,
      likes: 0,
    }).returning();
    
    return result[0];
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const { id: _, createdAt: __, ...updateData } = updates as any;
    
    const result = await db.update(projects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async getAchievements(featured?: boolean, limit?: number, offset?: number): Promise<Achievement[]> {
    let query = db.select().from(achievements);
    
    if (featured !== undefined) {
      query = query.where(eq(achievements.isFeatured, featured)) as any;
    }
    
    query = query.orderBy(desc(achievements.createdAt)) as any;
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    if (offset) {
      query = query.offset(offset) as any;
    }
    
    return await query;
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const result = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
    return result[0];
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const result = await db.insert(achievements).values({
      id,
      ...achievement,
      isFeatured: achievement.isFeatured ?? false,
      likes: 0,
    }).returning();
    
    return result[0];
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const { id: _, createdAt: __, ...updateData } = updates as any;
    
    const result = await db.update(achievements)
      .set(updateData)
      .where(eq(achievements.id, id))
      .returning();
    
    return result[0];
  }

  async deleteAchievement(id: string): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id)).returning();
    return result.length > 0;
  }

  async getComments(projectId?: string, achievementId?: string): Promise<(Comment & { user: Pick<User, 'id' | 'name' | 'avatar'> })[]> {
    const conditions = [];
    if (projectId) {
      conditions.push(eq(comments.projectId, projectId));
    }
    if (achievementId) {
      conditions.push(eq(comments.achievementId, achievementId));
    }
    
    let query = db.select({
      id: comments.id,
      content: comments.content,
      userId: comments.userId,
      projectId: comments.projectId,
      achievementId: comments.achievementId,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(comments.createdAt)) as any;
    
    const result = await query;
    
    return result.map(row => ({
      id: row.id,
      content: row.content,
      userId: row.userId,
      projectId: row.projectId,
      achievementId: row.achievementId,
      createdAt: row.createdAt,
      user: row.user || { id: row.userId, name: 'Unknown User', avatar: null }
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const result = await db.insert(comments).values({
      id,
      ...comment,
      projectId: comment.projectId || null,
      achievementId: comment.achievementId || null,
    }).returning();
    
    return result[0];
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id)).returning();
    return result.length > 0;
  }

  async toggleLike(like: InsertLike): Promise<{ liked: boolean; count: number }> {
    const normalizedProjectId = like.projectId || null;
    const normalizedAchievementId = like.achievementId || null;
    
    const conditions = [eq(likes.userId, like.userId)];
    if (normalizedProjectId) {
      conditions.push(eq(likes.projectId, normalizedProjectId));
    }
    if (normalizedAchievementId) {
      conditions.push(eq(likes.achievementId, normalizedAchievementId));
    }
    
    const existingLike = await db.select().from(likes).where(and(...conditions)).limit(1);
    
    if (existingLike.length > 0) {
      await db.delete(likes).where(eq(likes.id, existingLike[0].id));
      
      if (normalizedProjectId) {
        await db.update(projects)
          .set({ likes: sql`GREATEST(0, ${projects.likes} - 1)` })
          .where(eq(projects.id, normalizedProjectId));
      }
      if (normalizedAchievementId) {
        await db.update(achievements)
          .set({ likes: sql`GREATEST(0, ${achievements.likes} - 1)` })
          .where(eq(achievements.id, normalizedAchievementId));
      }
      
      const count = await this.getLikeCount(normalizedProjectId || undefined, normalizedAchievementId || undefined);
      return { liked: false, count };
    } else {
      const id = randomUUID();
      await db.insert(likes).values({
        id,
        userId: like.userId,
        projectId: normalizedProjectId,
        achievementId: normalizedAchievementId,
      });
      
      if (normalizedProjectId) {
        await db.update(projects)
          .set({ likes: sql`${projects.likes} + 1` })
          .where(eq(projects.id, normalizedProjectId));
      }
      if (normalizedAchievementId) {
        await db.update(achievements)
          .set({ likes: sql`${achievements.likes} + 1` })
          .where(eq(achievements.id, normalizedAchievementId));
      }
      
      const count = await this.getLikeCount(normalizedProjectId || undefined, normalizedAchievementId || undefined);
      return { liked: true, count };
    }
  }

  private async getLikeCount(projectId?: string, achievementId?: string): Promise<number> {
    if (projectId) {
      const result = await db.select({ likes: projects.likes }).from(projects).where(eq(projects.id, projectId)).limit(1);
      return result[0]?.likes ?? 0;
    }
    if (achievementId) {
      const result = await db.select({ likes: achievements.likes }).from(achievements).where(eq(achievements.id, achievementId)).limit(1);
      return result[0]?.likes ?? 0;
    }
    return 0;
  }

  async getUserLikes(userId: string): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.userId, userId));
  }

  async getTools(featured?: boolean, limit?: number, offset?: number): Promise<Tool[]> {
    let query = db.select().from(tools);
    
    if (featured !== undefined) {
      query = query.where(eq(tools.isFeatured, featured)) as any;
    }
    
    query = query.orderBy(asc(tools.order), asc(tools.name)) as any;
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    if (offset) {
      query = query.offset(offset) as any;
    }
    
    return await query;
  }

  async getTool(id: string): Promise<Tool | undefined> {
    const result = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
    return result[0];
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const id = randomUUID();
    const result = await db.insert(tools).values({
      id,
      ...tool,
      iconUrl: tool.iconUrl || null,
      category: tool.category || null,
      website: tool.website || null,
      isFeatured: tool.isFeatured ?? false,
      order: tool.order ?? 0,
    }).returning();
    
    return result[0];
  }

  async updateTool(id: string, updates: Partial<Tool>): Promise<Tool | undefined> {
    const { id: _, createdAt: __, ...updateData } = updates as any;
    
    const result = await db.update(tools)
      .set(updateData)
      .where(eq(tools.id, id))
      .returning();
    
    return result[0];
  }

  async deleteTool(id: string): Promise<boolean> {
    const result = await db.delete(tools).where(eq(tools.id, id)).returning();
    return result.length > 0;
  }
}
