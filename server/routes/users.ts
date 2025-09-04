import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['NEC_ADMIN', 'NEC_ENGINEER', 'NEC_GENERAL', 'CLIENT']),
  region: z.string().optional(),
  permissions: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['NEC_ADMIN', 'NEC_ENGINEER', 'NEC_GENERAL', 'CLIENT']).optional(),
  region: z.string().optional(),
  permissions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

const bulkOperationSchema = z.object({
  userIds: z.array(z.string()),
  operation: z.enum(['activate', 'deactivate', 'delete', 'updateRole']),
  data: z.object({
    role: z.enum(['NEC_ADMIN', 'NEC_ENGINEER', 'NEC_GENERAL', 'CLIENT']).optional(),
    region: z.string().optional(),
  }).optional(),
});

// Get all users with pagination and filtering
router.get('/', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, region, search, status } = req.query;
    
    const users = await storage.getUsers({
      page: Number(page),
      limit: Number(limit),
      role: role as string,
      region: region as string,
      search: search as string,
      status: status as string,
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const userData = createUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    
    const user = await storage.createUser({
      ...userData,
      password: tempPassword, // In real app, this would be hashed
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).user.id,
      action: 'CREATE_USER',
      targetUserId: user.id,
      details: { email: userData.email, role: userData.role },
      timestamp: new Date(),
    });
    
    // In real app, send welcome email with temp password
    console.log(`User created: ${userData.email}, Temp password: ${tempPassword}`);
    
    res.status(201).json({ 
      user: { ...user, password: undefined }, 
      tempPassword,
      message: 'User created successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const userData = updateUserSchema.parse(req.body);
    
    const existingUser = await storage.getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUser = await storage.updateUser(req.params.id, {
      ...userData,
      updatedAt: new Date(),
    });
    
    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).user.id,
      action: 'UPDATE_USER',
      targetUserId: req.params.id,
      details: userData,
      timestamp: new Date(),
    });
    
    res.json({ user: updatedUser, message: 'User updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (soft delete)
router.delete('/:id', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const existingUser = await storage.getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent self-deletion
    if (req.params.id === (req as any).user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await storage.deleteUser(req.params.id);
    
    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).user.id,
      action: 'DELETE_USER',
      targetUserId: req.params.id,
      details: { email: existingUser.email },
      timestamp: new Date(),
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Bulk operations
router.post('/bulk', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const operationData = bulkOperationSchema.parse(req.body);
    
    const result = await storage.bulkUserOperation(operationData);
    
    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).user.id,
      action: 'BULK_USER_OPERATION',
      targetUserId: null,
      details: { operation: operationData.operation, userCount: operationData.userIds.length },
      timestamp: new Date(),
    });
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ message: 'Failed to perform bulk operation' });
  }
});

// Reset user password
router.post('/:id/reset-password', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const existingUser = await storage.getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newPassword = generateTempPassword();
    await storage.updateUserPassword(req.params.id, newPassword);
    
    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).user.id,
      action: 'RESET_PASSWORD',
      targetUserId: req.params.id,
      details: { email: existingUser.email },
      timestamp: new Date(),
    });
    
    res.json({ tempPassword: newPassword, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Get user activity logs
router.get('/:id/activity', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const activity = await storage.getUserActivity(req.params.id, {
      page: Number(page),
      limit: Number(limit),
    });
    
    res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Failed to fetch user activity' });
  }
});

// Generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default router;
