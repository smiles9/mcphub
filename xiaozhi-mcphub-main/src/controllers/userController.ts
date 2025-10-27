import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import {
  getAllUsers,
  getUserByUsername,
  createNewUser,
  updateUser,
  deleteUser,
  getUserCount,
  getAdminCount,
} from '../services/userService.js';
import { getSystemConfigService } from '../services/systemConfigService.js';

// Admin permission check middleware function
const requireAdmin = async (req: Request, res: Response): Promise<boolean> => {
  const systemConfigService = getSystemConfigService();
  const systemConfig = await systemConfigService.getSystemConfig();
  if (systemConfig?.routing?.skipAuth) {
    return true;
  }

  const user = (req as any).user;
  if (!user || !user.isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Admin privileges required',
    });
    return false;
  }
  return true;
};

// Get all users (admin only)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const users = await getAllUsers(); // Already returns users without password
    const response: ApiResponse = {
      success: true,
      data: users,
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users information',
    });
  }
};

// Get a specific user by username (admin only)
export const getUser = async (req: Request, res: Response): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { username } = req.params;
    if (!username) {
      res.status(400).json({
        success: false,
        message: 'Username is required',
      });
      return;
    }

    const user = await getUserByUsername(username);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: user, // Already without password
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    });
  }
};

// Create a new user (admin only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { username, password, isAdmin } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
      return;
    }

    const newUser = await createNewUser(username, password, isAdmin || false);
    if (!newUser) {
      res.status(400).json({
        success: false,
        message: 'Failed to create user or username already exists',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: newUser, // Already without password
      message: 'User created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update an existing user (admin only)
export const updateExistingUser = async (req: Request, res: Response): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { username } = req.params;
    const { isAdmin, newPassword } = req.body;

    if (!username) {
      res.status(400).json({
        success: false,
        message: 'Username is required',
      });
      return;
    }

    // Check if trying to change admin status
    if (isAdmin !== undefined) {
      const currentUser = await getUserByUsername(username);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Prevent removing admin status from the last admin
      if (currentUser.isAdmin && !isAdmin && await getAdminCount() === 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot remove admin status from the last admin user',
        });
        return;
      }
    }

    const updateData: any = {};
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (newPassword) updateData.newPassword = newPassword;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one field (isAdmin or newPassword) is required to update',
      });
      return;
    }

    const updatedUser = await updateUser(username, updateData);
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found or update failed',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: updatedUser, // Already without password
      message: 'User updated successfully',
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete a user (admin only)
export const deleteExistingUser = async (req: Request, res: Response): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const { username } = req.params;
    if (!username) {
      res.status(400).json({
        success: false,
        message: 'Username is required',
      });
      return;
    }

    // Check if trying to delete the current admin user
    const currentUser = (req as any).user;
    if (currentUser.username === username) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
      return;
    }

    const success = await deleteUser(username);
    if (!success) {
      res.status(400).json({
        success: false,
        message: 'User not found, failed to delete, or cannot delete the last admin',
      });
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get user statistics (admin only)
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const totalUsers = await getUserCount();
    const adminUsers = await getAdminCount();
    const regularUsers = totalUsers - adminUsers;

    const response: ApiResponse = {
      success: true,
      data: {
        totalUsers,
        adminUsers,
        regularUsers,
      },
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
    });
  }
};
