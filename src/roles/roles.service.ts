import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    const role = this.rolesRepository.create({
      ...createRoleDto,
      permissions: [],
    });

    return this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.findByName(updateRoleDto.name);
      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    Object.assign(role, updateRoleDto);
    return this.rolesRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepository.remove(role);
  }

  async assignPermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findOne(roleId);
    const permission = await this.permissionsService.findOne(permissionId);

    const alreadyAssigned = role.permissions.some((p) => p.id === permissionId);
    if (alreadyAssigned) {
      throw new BadRequestException('Permission already assigned to this role');
    }

    role.permissions.push(permission);
    return this.rolesRepository.save(role);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findOne(roleId);

    const permissionIndex = role.permissions.findIndex(
      (p) => p.id === permissionId,
    );

    if (permissionIndex === -1) {
      throw new NotFoundException('Permission not assigned to this role');
    }

    role.permissions.splice(permissionIndex, 1);
    return this.rolesRepository.save(role);
  }
}
