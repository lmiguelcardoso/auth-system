import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPermissions1707500001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      { name: 'users:read', resource: 'users', action: 'read' },
      { name: 'users:create', resource: 'users', action: 'create' },
      { name: 'users:update', resource: 'users', action: 'update' },
      { name: 'users:delete', resource: 'users', action: 'delete' },
      { name: 'roles:read', resource: 'roles', action: 'read' },
      { name: 'roles:create', resource: 'roles', action: 'create' },
      { name: 'roles:update', resource: 'roles', action: 'update' },
      { name: 'roles:delete', resource: 'roles', action: 'delete' },
      {
        name: 'roles:assign-permission',
        resource: 'roles',
        action: 'assign-permission',
      },
      { name: 'permissions:read', resource: 'permissions', action: 'read' },
      {
        name: 'permissions:create',
        resource: 'permissions',
        action: 'create',
      },
      {
        name: 'permissions:update',
        resource: 'permissions',
        action: 'update',
      },
      {
        name: 'permissions:delete',
        resource: 'permissions',
        action: 'delete',
      },
    ];

    for (const permission of permissions) {
      await queryRunner.query(
        `
        INSERT INTO permission (name, resource, action)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `,
        [permission.name, permission.resource, permission.action],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM permission WHERE resource IN ('users', 'roles', 'permissions')`,
    );
  }
}
