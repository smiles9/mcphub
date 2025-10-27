import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { getUserService } from '../services/userService.js';
import { getDataService } from '../services/services.js';
import { DataService } from '../services/dataService.js';
import { JWT_SECRET } from '../config/jwt.js';

const dataService: DataService = getDataService();

const TOKEN_EXPIRY = '24h';

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  // Get translation function from request
  const t = (req as any).t;

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: t('api.errors.validation_failed'),
      errors: errors.array(),
    });
    return;
  }

  const { username, password } = req.body;
  const userService = getUserService();

  try {
    // Find user by username (with password for authentication)
    const user = await userService.getUserByUsernameWithPassword(username);

    if (!user) {
      res.status(401).json({
        success: false,
        message: t('api.errors.invalid_credentials'),
      });
      return;
    }

    // Verify password
    const isPasswordValid = await userService.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: t('api.errors.invalid_credentials'),
      });
      return;
    }

    // Generate JWT token
    const payload = {
      user: {
        username: user.username,
        isAdmin: user.isAdmin || false,
      },
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY }, (err, token) => {
      if (err) throw err;
      res.json({
        success: true,
        message: t('api.success.login_successful'),
        token,
        user: {
          username: user.username,
          isAdmin: user.isAdmin,
          permissions: dataService.getPermissions(user),
        },
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: t('api.errors.server_error'),
    });
  }
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  // Get translation function from request
  const t = (req as any).t;

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: t('api.errors.validation_failed'),
      errors: errors.array(),
    });
    return;
  }

  const { username, password, isAdmin } = req.body;
  const userService = getUserService();

  try {
    // Create new user
    const newUser = await userService.createUser(username, password, isAdmin);

    if (!newUser) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    // Generate JWT token
    const payload = {
      user: {
        username: newUser.username,
        isAdmin: newUser.isAdmin || false,
      },
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY }, (err, token) => {
      if (err) throw err;
      res.json({
        success: true,
        token,
        user: {
          username: newUser.username,
          isAdmin: newUser.isAdmin,
          permissions: dataService.getPermissions(newUser as any),
        },
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get current user
export const getCurrentUser = (req: Request, res: Response): void => {
  try {
    // User is already attached to request by auth middleware
    const user = (req as any).user;

    res.json({
      success: true,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        permissions: dataService.getPermissions(user),
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  const username = (req as any).user.username;
  const userService = getUserService();

  try {
    // Find user by username
    const user = await userService.getUserByUsernameWithPassword(username);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await userService.verifyPassword(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    // Update the password
    const updated = await userService.updateUserPassword(username, newPassword);

    if (!updated) {
      res.status(500).json({ success: false, message: 'Failed to update password' });
      return;
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
