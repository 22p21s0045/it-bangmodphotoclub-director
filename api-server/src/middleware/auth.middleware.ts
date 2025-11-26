import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// import { getToken } from 'next-auth/jwt'; // We might need to implement manual JWT verification if next-auth/jwt is not compatible or if we want to verify the token signature directly.
// For now, let's assume we receive a Bearer token and we will verify it.
// Since we are using Auth.js v5, the token format depends on the strategy.
// If using JWT strategy, we can verify the signature.

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // For public routes, we might want to allow this, but for protected routes, this middleware should probably be applied selectively or handle optional auth.
      // For now, let's assume this middleware is applied globally or to protected routes.
      // If global, we need a way to skip.
      // Let's just pass for now and let Guards handle the strict check, or attach user if present.
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      // TODO: Verify token with Auth.js secret
      // const secret = process.env.AUTH_SECRET;
      // const decoded = await verify(token, secret);
      // req['user'] = decoded;
      
      // Mock implementation for now until we have the exact Auth.js JWT structure
      // req['user'] = { id: 'mock-user-id', email: 'mock@example.com' };
    } catch (error) {
      console.error('Auth middleware error:', error);
    }

    next();
  }
}
