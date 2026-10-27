import { AdminProfileEntity } from '../../auth/entities/admin-profile.entity';

export class AdminUserEntity extends AdminProfileEntity {
  isActive: boolean;
  updatedAt: Date;
}
