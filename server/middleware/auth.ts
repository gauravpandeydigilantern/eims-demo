import { Request, Response, NextFunction } from 'express';

// Middleware to ensure user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

// Middleware to ensure user has admin privileges
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user || (user.role !== 'NEC_ADMIN' && user.role !== 'NEC_GENERAL')) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
}

// Middleware to ensure user has regional access
export function hasRegionalAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // NEC_ENGINEER users have regional restrictions
  if (user.role === 'NEC_ENGINEER' && !user.region) {
    return res.status(403).json({ message: 'Regional access not configured' });
  }
  
  next();
}

// Middleware to ensure user has admin access (NEC_ADMIN only)
export function hasAdminAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (user.role !== 'NEC_ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}
