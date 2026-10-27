import { Module } from '@nestjs/common';
import { AdminHeroController, HeroController } from './hero.controller';
import { HeroService } from './hero.service';

@Module({
  controllers: [HeroController, AdminHeroController],
  providers: [HeroService],
})
export class HeroModule {}
