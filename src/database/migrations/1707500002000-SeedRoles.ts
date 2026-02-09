import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRoles1707500002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admin role
    await queryRunner.query(
      `
      INSERT INTO role (name, description)
      VALUES ($1, $2)
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `,
      ['admin', 'Full system access'],
    );

    // Get admin role id
    const roles = (await queryRunner.query(
      `SELECT id FROM role WHERE name = $1`,
      ['admin'],
    )) as Array<{ id: string }>;
    const adminRole = roles[0];

    if (!adminRole) {
      return;
    }

    // Get all permissions
    const permissions = (await queryRunner.query(
      `SELECT id FROM permission`,
    )) as Array<{ id: string }>;

    // Assign all permissions to admin role
    for (const permission of permissions) {
      await queryRunner.query(
        `
        INSERT INTO role_permissions_permission (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `,
        [adminRole.id, permission.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM role WHERE name = $1`, ['admin']);
  }
}
