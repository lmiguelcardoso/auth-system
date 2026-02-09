import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { databaseConfig } from './database.config';

config();

export const AppDataSource = new DataSource({
  ...databaseConfig,
  entities: [Permission, Role, User],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
