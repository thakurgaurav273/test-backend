import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
} from '../../common/decorators/current-admin.decorator';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';
import { AdminUserEntity } from './entities/admin-user.entity';

/** ADMIN-only (no @Roles), so CONTENT and PRE_SALES users cannot manage accounts. */
@ApiTags('Admin / Users')
@AdminApi()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiEnvelope(AdminUserEntity, { isArray: true })
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @ApiEnvelope(AdminUserEntity)
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an admin, content or pre-sales user' })
  @ApiEnvelope(AdminUserEntity, { status: 201 })
  create(@Body() dto: CreateAdminUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change name, role or active status' })
  @ApiEnvelope(AdminUserEntity)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.users.update(id, dto, admin.id);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    await this.users.remove(id, admin.id);
    return { deleted: true };
  }
}
