import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface Permission {
  name: string;
}

interface UserWithPermissions {
  permissions?: Permission[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: UserWithPermissions }>();

    if (!user) {
      return false;
    }

    const userPermissions = user.permissions?.map((p) => p.name) || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
