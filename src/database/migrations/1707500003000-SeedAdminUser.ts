import { MigrationInterface, QueryRunner } from 'typeorm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

export class SeedAdminUser1707500003000 implements MigrationInterface {
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      KEY_LENGTH,
    )) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get admin role
    const roles = (await queryRunner.query(
      `SELECT id FROM role WHERE name = $1`,
      ['admin'],
    )) as Array<{ id: string }>;

    const adminRole = roles[0] as { id: string } | undefined;

    if (!adminRole) {
      console.warn('Admin role not found. Skipping admin user creation.');
      return;
    }

    // Create admin user
    const hashedPassword = await this.hashPassword('admin');

    await queryRunner.query(
      `
      INSERT INTO "user" (email, password, name, "roleId")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `,
      ['admin@admin.com', hashedPassword, 'Admin', adminRole.id],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "user" WHERE email = $1`, [
      'admin@admin.com',
    ]);
  }
}
