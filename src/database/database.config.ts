import { registerAs } from '@nestjs/config';

export const databaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'auth_user',
  password: process.env.DB_PASSWORD || 'auth_password',
  database: process.env.DB_NAME || 'auth_system',
};

export default registerAs('database', () => databaseConfig);
