import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

export function getSession() {
  const sessionTtl = 8 * 60 * 60 * 1000; // 8 hours as per documentation
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000, // convert to seconds
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for email/password authentication
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email: string, password: string, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        return done(null, false, { message: 'Account is temporarily locked due to too many failed attempts' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        // Increment login attempts
        await storage.incrementLoginAttempts(user.id);
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Reset login attempts and update last login
      await storage.resetLoginAttempts(user.id);
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check user role
export const hasRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

// Middleware to check regional access for engineers
export const hasRegionalAccess = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as User;
  
  // NEC_GENERAL and NEC_ADMIN have global access
  if (user.role === 'NEC_GENERAL' || user.role === 'NEC_ADMIN') {
    return next();
  }

  // NEC_ENGINEER needs regional restrictions
  if (user.role === 'NEC_ENGINEER') {
    // Add regional filter to the request for use in controllers
    req.userRegion = user.region;
    return next();
  }

  // CLIENT users have read-only access
  if (user.role === 'CLIENT') {
    req.readOnly = true;
    return next();
  }

  return res.status(403).json({ message: "Insufficient permissions" });
};

// Admin-only access middleware
export const hasAdminAccess = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as User;
  
  if (user.role !== 'NEC_GENERAL' && user.role !== 'NEC_ADMIN') {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  
  next();
};

// Hash password utility
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password utility
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};