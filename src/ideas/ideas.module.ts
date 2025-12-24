import { Module } from '@nestjs/common';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [IdeasController],
    providers: [IdeasService],
})
export class IdeasModule { }
