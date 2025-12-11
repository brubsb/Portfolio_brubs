import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertProjectSchema, 
  insertAchievementSchema, 
  insertCommentSchema,
  insertLikeSchema,
  insertToolSchema,
  loginSchema 
} from "@shared/schema";
import { sendEmail } from "./services/email";
import { shareOnLinkedIn } from "./services/linkedin";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "temp-dev-secret-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Middleware for JWT authentication
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware for admin authentication
function authenticateAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast notification to all connected clients
  function broadcastNotification(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Serve uploaded files securely
  app.use('/uploads', express.static(uploadsDir, { 
    fallthrough: false,
    index: false
  }));

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { id: user.id, email: user.email, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
      
      // Send password reset email
      const emailSent = await sendEmail({
        to: email,
        from: 'noreply@portfolio.com',
        subject: 'Redefinir senha - Portfólio Digital',
        html: `
          <h2>Redefinir sua senha</h2>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}">
            Redefinir senha
          </a>
          <p>Este link expira em 1 hora.</p>
        `
      });

      if (emailSent) {
        res.json({ message: 'Email de recuperação enviado' });
      } else {
        res.status(500).json({ message: 'Erro ao enviar email' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update user profile (including avatar)
  app.patch('/api/user/profile', authenticateToken, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'aboutPhoto', maxCount: 1 }
  ]), async (req, res) => {
    try {
      if (!req.user) {
        console.log('Profile update: User not authenticated');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      console.log('Profile update request from user:', req.user.id, req.user.email);
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const updates: any = {};

      // Handle avatar upload
      if (files && files.avatar && files.avatar[0]) {
        updates.avatar = `/uploads/${files.avatar[0].filename}`;
        console.log('Avatar file uploaded:', files.avatar[0].filename);
      }

      // Handle about photo upload
      if (files && files.aboutPhoto && files.aboutPhoto[0]) {
        updates.aboutPhoto = `/uploads/${files.aboutPhoto[0].filename}`;
        console.log('About photo file uploaded:', files.aboutPhoto[0].filename);
      }

      // Handle other profile updates (name, etc.)
      if (req.body.name) {
        updates.name = req.body.name;
      }

      console.log('Updates to apply:', updates);
      
      // First check if user exists
      const existingUser = await storage.getUser(req.user.id);
      console.log('Existing user found:', existingUser ? 'YES' : 'NO');
      if (existingUser) {
        console.log('Existing user details:', { id: existingUser.id, email: existingUser.email, name: existingUser.name });
      }

      const updatedUser = await storage.updateUser(req.user.id, updates);
      
      if (!updatedUser) {
        console.log('Failed to update user - user not found in storage');
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user data (excluding password)
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          aboutPhoto: updatedUser.aboutPhoto,
          aboutText: updatedUser.aboutText,
          aboutDescription: updatedUser.aboutDescription,
          heroSubtitle: updatedUser.heroSubtitle,
          skills: updatedUser.skills,
          isAdmin: updatedUser.isAdmin
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

  // Update about photo
  app.patch('/api/user/about-photo', authenticateToken, upload.single('aboutPhoto'), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'No photo file provided' });
      }

      const updates = {
        aboutPhoto: `/uploads/${file.filename}`
      };

      console.log('About photo upload request from user:', req.user.id, file.filename);
      
      const updatedUser = await storage.updateUser(req.user.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user data (excluding password)
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          aboutPhoto: updatedUser.aboutPhoto,
          aboutText: updatedUser.aboutText,
          aboutDescription: updatedUser.aboutDescription,
          heroSubtitle: updatedUser.heroSubtitle,
          skills: updatedUser.skills,
          isAdmin: updatedUser.isAdmin
        }
      });
    } catch (error) {
      console.error('Update about photo error:', error);
      res.status(500).json({ message: 'Error updating about photo' });
    }
  });

  // Update user about information
  app.patch('/api/user/about', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { aboutText, aboutDescription, heroSubtitle, skills } = req.body;
      const updates: any = {};

      if (aboutText !== undefined) updates.aboutText = aboutText;
      if (aboutDescription !== undefined) updates.aboutDescription = aboutDescription;
      if (heroSubtitle !== undefined) updates.heroSubtitle = heroSubtitle;
      if (skills !== undefined) updates.skills = skills;

      console.log('About info update request from user:', req.user.id, updates);
      
      const updatedUser = await storage.updateUser(req.user.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user data (excluding password)
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          aboutPhoto: updatedUser.aboutPhoto,
          aboutText: updatedUser.aboutText,
          aboutDescription: updatedUser.aboutDescription,
          heroSubtitle: updatedUser.heroSubtitle,
          skills: updatedUser.skills,
          isAdmin: updatedUser.isAdmin
        }
      });
    } catch (error) {
      console.error('Update about info error:', error);
      res.status(500).json({ message: 'Error updating about information' });
    }
  });

  // Public profile endpoint
  app.get('/api/profile', async (req, res) => {
    try {
      // Get admin user for public profile
      const adminUser = await storage.getAdminUser();
      
      if (!adminUser) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Return only public fields (excluding password and admin status)
      res.json({
        name: adminUser.name,
        avatar: adminUser.avatar,
        aboutPhoto: adminUser.aboutPhoto,
        aboutText: adminUser.aboutText,
        aboutDescription: adminUser.aboutDescription,
        heroSubtitle: adminUser.heroSubtitle,
        skills: adminUser.skills
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  });

  // Projects routes
  app.get('/api/projects', async (req, res) => {
    try {
      const published = req.query.published === 'true' ? true : 
                      req.query.published === 'false' ? false : undefined;
      const featured = req.query.featured === 'true' ? true : 
                     req.query.featured === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const projects = await storage.getProjects(published, featured, limit, offset);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching project' });
    }
  });

  app.post('/api/projects', authenticateToken, authenticateAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const projectData = insertProjectSchema.parse({
        ...req.body,
        tags: JSON.parse(req.body.tags || '[]'),
        technologies: JSON.parse(req.body.technologies || '[]'),
        isPublished: req.body.isPublished === 'true',
        isFeatured: req.body.isFeatured === 'true',
        imageUrl: files?.image?.[0] ? `/uploads/${files.image[0].filename}` : req.body.imageUrl,
        videoUrl: files?.video?.[0] ? `/uploads/${files.video[0].filename}` : req.body.videoUrl,
      });

      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: 'Invalid project data' });
    }
  });

  app.patch('/api/projects/:id', authenticateToken, authenticateAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const updates: any = { ...req.body };
      
      if (req.body.tags) {
        updates.tags = JSON.parse(req.body.tags);
      }
      if (req.body.technologies) {
        updates.technologies = JSON.parse(req.body.technologies);
      }
      if (req.body.isPublished !== undefined) {
        updates.isPublished = req.body.isPublished === 'true';
      }
      if (req.body.isFeatured !== undefined) {
        updates.isFeatured = req.body.isFeatured === 'true';
      }
      if (files?.image?.[0]) {
        updates.imageUrl = `/uploads/${files.image[0].filename}`;
      }
      if (files?.video?.[0]) {
        updates.videoUrl = `/uploads/${files.video[0].filename}`;
      }

      const project = await storage.updateProject(req.params.id, updates);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: 'Invalid project data' });
    }
  });

  app.delete('/api/projects/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting project' });
    }
  });

  // Achievements routes
  app.get('/api/achievements', async (req, res) => {
    try {
      const featured = req.query.featured === 'true' ? true : 
                     req.query.featured === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const achievements = await storage.getAchievements(featured, limit, offset);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching achievements' });
    }
  });

  app.post('/api/achievements', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const achievementData = insertAchievementSchema.parse({
        ...req.body,
        date: new Date(req.body.date)
      });

      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: 'Invalid achievement data' });
    }
  });

  app.patch('/api/achievements/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const updates = { ...req.body };
      if (req.body.date) {
        updates.date = new Date(req.body.date);
      }

      const achievement = await storage.updateAchievement(req.params.id, updates);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: 'Invalid achievement data' });
    }
  });

  app.delete('/api/achievements/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteAchievement(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      res.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting achievement' });
    }
  });

  // Comments routes
  app.get('/api/comments', async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const achievementId = req.query.achievementId as string;
      
      const comments = await storage.getComments(projectId, achievementId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching comments' });
    }
  });

  app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const comment = await storage.createComment(commentData);
      
      // Notify admin of new comment
      broadcastNotification('new_comment', {
        comment,
        projectId: commentData.projectId,
        achievementId: commentData.achievementId
      });

      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: 'Invalid comment data' });
    }
  });

  app.delete('/api/comments/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const success = await storage.deleteComment(req.params.id);
      if (success) {
        res.json({ message: 'Comment deleted successfully' });
      } else {
        res.status(404).json({ message: 'Comment not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting comment' });
    }
  });

  // Likes routes
  app.post('/api/likes/toggle', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const likeData = insertLikeSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const result = await storage.toggleLike(likeData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: 'Invalid like data' });
    }
  });

  app.get('/api/likes/user', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const likes = await storage.getUserLikes(req.user.id);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user likes' });
    }
  });

  // LinkedIn sharing route
  app.post('/api/share/linkedin', authenticateToken, async (req, res) => {
    try {
      const { projectId, achievementId } = req.body;
      let item;
      
      if (projectId) {
        item = await storage.getProject(projectId);
      } else if (achievementId) {
        item = await storage.getAchievement(achievementId);
      }
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const shareUrl = await shareOnLinkedIn({
        title: item.title,
        description: item.description,
        url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/${projectId ? 'projects' : 'achievements'}/${item.id}`,
        imageUrl: 'imageUrl' in item ? item.imageUrl || undefined : undefined
      });

      res.json({ shareUrl });
    } catch (error) {
      res.status(500).json({ message: 'Error sharing to LinkedIn' });
    }
  });

  // Tools routes
  app.get('/api/tools', async (req, res) => {
    try {
      const featured = req.query.featured === 'true' ? true : 
                     req.query.featured === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const tools = await storage.getTools(featured, limit, offset);
      res.json(tools);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tools' });
    }
  });

  app.get('/api/tools/:id', async (req, res) => {
    try {
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ message: 'Tool not found' });
      }
      res.json(tool);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tool' });
    }
  });

  app.post('/api/tools', authenticateToken, authenticateAdmin, upload.single('icon'), async (req, res) => {
    try {
      const file = req.file;
      const toolData = insertToolSchema.parse({
        ...req.body,
        isFeatured: req.body.isFeatured === 'true',
        order: parseInt(req.body.order) || 0,
        iconUrl: file ? `/uploads/${file.filename}` : req.body.iconUrl,
      });

      const tool = await storage.createTool(toolData);
      res.json(tool);
    } catch (error) {
      res.status(400).json({ message: 'Invalid tool data' });
    }
  });

  app.patch('/api/tools/:id', authenticateToken, authenticateAdmin, upload.single('icon'), async (req, res) => {
    try {
      const file = req.file;
      const updates: any = { ...req.body };
      
      if (req.body.isFeatured !== undefined) {
        updates.isFeatured = req.body.isFeatured === 'true';
      }
      if (req.body.order !== undefined) {
        updates.order = parseInt(req.body.order);
      }
      if (file) {
        updates.iconUrl = `/uploads/${file.filename}`;
      }

      const tool = await storage.updateTool(req.params.id, updates);
      if (!tool) {
        return res.status(404).json({ message: 'Tool not found' });
      }
      res.json(tool);
    } catch (error) {
      res.status(400).json({ message: 'Invalid tool data' });
    }
  });

  app.delete('/api/tools/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTool(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Tool not found' });
      }
      res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tool' });
    }
  });

  // Admin stats route
  app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const achievements = await storage.getAchievements();
      const comments = await storage.getComments();
      const tools = await storage.getTools();
      
      const totalLikes = projects.reduce((sum, p) => sum + p.likes, 0) +
                        achievements.reduce((sum, a) => sum + a.likes, 0);
      
      const publishedProjects = projects.filter(p => p.isPublished);
      const draftProjects = projects.filter(p => !p.isPublished);

      res.json({
        totalProjects: projects.length,
        publishedProjects: publishedProjects.length,
        draftProjects: draftProjects.length,
        totalAchievements: achievements.length,
        totalTools: tools.length,
        totalLikes,
        totalComments: comments.length,
        recentComments: comments.slice(0, 5),
        popularProjects: projects
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching admin stats' });
    }
  });

  return httpServer;
}
