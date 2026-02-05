import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsUUID()
  @IsOptional()
  roleId?: string;
}
