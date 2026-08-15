import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../types.js';
import { store } from '../db/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'where-is-my-truck-inbound-logistics-secret-key-2026';

// Extend Express Request to hold authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Plaintext demo user credentials stored on backend
export const DEMO_CREDENTIALS: Record<string, { role: UserRole; pass: string }> = {
  'admin@warehouse.logistics': { role: 'ADMIN', pass: 'admin' },
  'kaviya@warehouse.logistics': { role: 'OPERATOR', pass: 'operator' },
  'sri@controltower.logistics': { role: 'MANAGER', pass: 'manager' },
  'abi@apexretail.com': { role: 'CUSTOMER', pass: 'customer' },
};

/**
 * Base64 URL encode helper
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64 URL decode helper
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString();
}

/**
 * Generate a cryptographically signed HMAC-SHA256 JWT token
 */
export function generateToken(user: User, expiresInSeconds = 86400): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Authenticate login with plaintext credentials and return user + JWT token
 */
export function authenticateUser(email: string, pass: string): { user: User; token: string } | null {
  const normEmail = email.trim().toLowerCase();
  const entry = DEMO_CREDENTIALS[normEmail];
  if (!entry || entry.pass !== pass.trim()) {
    return null;
  }

  const users = store.getUsers();
  let user = users.find(u => u.email.toLowerCase() === normEmail);

  if (!user) {
    user = {
      id: `usr-${entry.role.toLowerCase()}`,
      name: normEmail.split('@')[0],
      email: normEmail,
      role: entry.role,
      title: `${entry.role} Specialist`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
  }

  const verifiedUser: User = user;
  const token = generateToken(verifiedUser);
  return { user: verifiedUser, token };
}

/**
 * Express Middleware: Requires a valid JWT token
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Bearer authentication token',
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      error: 'Unauthorized: Expired or invalid JWT token signature',
    });
  }

  req.user = payload;
  next();
}

/**
 * Express Middleware: Requires the user to have one of the specified roles
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Forbidden: User role '${req.user?.role}' does not have permission to access this resource. Allowed: [${allowedRoles.join(', ')}]`,
        });
      }
      next();
    });
  };
}
