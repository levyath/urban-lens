import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { GeocodeModule } from './modules/geocode/geocode.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, GeocodeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
