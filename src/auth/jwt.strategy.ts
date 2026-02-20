import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { jwtConstants } from './jwt.constants';

const jwtFromRequest = (req: Request | null): string | null => {
  if (!req) {
    return null;
  }

  const authorizationHeader = req.headers?.authorization;

  if (!authorizationHeader) {
    return null;
  }

  let normalizedHeader: string | undefined;

  if (typeof authorizationHeader === 'string') {
    normalizedHeader = authorizationHeader;
  } else if (Array.isArray(authorizationHeader)) {
    normalizedHeader = authorizationHeader[0];
  }

  if (!normalizedHeader) {
    return null;
  }

  const [scheme, token] = normalizedHeader.trim().split(/\s+/);

  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: { sub: number; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
