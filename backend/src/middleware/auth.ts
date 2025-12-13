import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import prisma from '../db/client';

// Extend Express Request type to include user
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Validates Supabase JWT token and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Ensure user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // Create user if first time (sync from Supabase Auth)
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.user_metadata?.full_name,
          avatarUrl: user.user_metadata?.avatar_url,
        },
      });
    }

    // Attach user to request
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || undefined,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth middleware
 * Attaches user if token present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || undefined,
        };
      }
    }
  } catch (error) {
    // Silently continue without user
  }

  next();
}

/**
 * Middleware to check if user owns a project
 */
export async function requireProjectOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const projectId = req.params.projectId || req.params.id;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}
