import {
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { MetaScopeInfo } from '../scopes/meta-scope.decorator';
import { CustomErrorException } from '@devseeder/microservices-exceptions';
import {
  EntitySchema,
  ErrorService,
  SchemaDependecyTokens,
} from '@devseeder/nestjs-microservices-schemas';
import { CustomJwtAuthGuard } from './custom-jwt-auth.guard';
import { ErrorAuthKey } from '../../enum/error-auth-keys.enum';

@Injectable()
export class EntityJwtAuthGuard extends CustomJwtAuthGuard {
  constructor(
    protected readonly reflector: Reflector,
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    protected readonly scopeKey: string,
    @Inject(SchemaDependecyTokens.ENTITY_SCHEMA_DB)
    protected readonly entitySchemaData: EntitySchema[],
    protected readonly errorService: ErrorService,
  ) {
    super(reflector, jwtService, configService, `${scopeKey}/ADM`);
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

      const metaScope = this.reflector.get<MetaScopeInfo>(
        'metaScopes',
        context.getHandler(),
      );

      if (!metaScope || !Object.keys(metaScope).length) return true;

      if (tokenPayload.scopes.indexOf(this.scopeADM) !== -1) return true;

      const scopes = this.getScopes(metaScope);

      let scopesPermission = 0;
      scopes.forEach((scope) => {
        if (tokenPayload.scopes.indexOf(scope) > -1) scopesPermission++;
      });

      if (!scopesPermission)
        await this.errorService.throwError(ErrorAuthKey.MISSING_SCOPE_AUTH);

      return true;
    } catch (err) {
      if (err instanceof CustomErrorException) throw err;
      throw new CustomErrorException(err.message, HttpStatus.UNAUTHORIZED);
    }
  }

  private getScopes(metaScopeInfo: MetaScopeInfo): string[] {
    const entitySchema = this.entitySchemaData.filter(
      (ent) => metaScopeInfo.entity === ent.entity,
    );
    if (!entitySchema.length) return [];
    const requestScopes = entitySchema[0].authScopes.filter(
      (req) => req.accessKey === metaScopeInfo.accessKey,
    );
    if (!requestScopes.length) return [];
    const schemaScopes = requestScopes[0].scopes.map(
      (scope) => `${this.scopeKey}/${scope.key}`,
    );
    return [
      ...schemaScopes,
      `${
        this.scopeKey
      }/${metaScopeInfo.entity.toUpperCase()}/${metaScopeInfo.accessKey.toUpperCase()}`,
    ];
  }
}
