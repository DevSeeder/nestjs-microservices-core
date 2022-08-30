import {
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AbstractGuard } from './abstract-guard.guard';

@Injectable()
export class CustomJwtAuthGuard extends AbstractGuard {
  constructor(
    protected readonly reflector: Reflector,
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    protected readonly scopeADM: string,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const bearerToken = this.getAuthToken(context, 'Bearer').replace(
        'Bearer ',
        '',
      );
      const tokenPayload = await this.jwtService.verifyAsync(bearerToken, {
        secret: this.configService.get<string>('auth.jwt.secret'),
        ignoreExpiration: true,
      });

      const scopes = this.reflector.get<string[]>(
        'scopes',
        context.getHandler(),
      );

      if (!scopes || scopes.length === 0) return true;

      if (tokenPayload.scopes.indexOf(this.scopeADM) !== -1) return true;

      scopes.forEach((scope) => {
        if (tokenPayload.scopes.indexOf(scope) === -1) {
          throw new ForbiddenException('Missing Scope Authorization');
        }
      });

      return true;
    } catch (err) {
      throw new HttpException(
        `Error JWT Auth: ${err.message}`,
        err.status === HttpStatus.ACCEPTED
          ? HttpStatus.UNAUTHORIZED
          : err.status,
      );
    }
  }
}
