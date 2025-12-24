import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { EnhanceIdeaDto } from './dto/enhance-idea.dto';
import { EnhanceIdeaResponse } from 'src/common/interfaces';

@Controller('api/ideas')
export class IdeasController {
    constructor(private readonly ideasService: IdeasService) { }

    @Post('enhance')
    async enhanceIdea(@Body() dto: EnhanceIdeaDto): Promise<EnhanceIdeaResponse> {
        try {

            if (!dto.idea || dto.idea.trim().length === 0)
                throw new HttpException('Idea is required', HttpStatus.BAD_REQUEST);

            if (dto.idea.length < 10)
                throw new HttpException('Please provide a more detailed idea (at least 10 characters)', HttpStatus.BAD_REQUEST);

            if (dto?.sendEmail && !dto.email)
                throw new HttpException('Email address is required when sendEmail is true', HttpStatus.BAD_REQUEST);

            if (dto.email && !this.isValidEmail(dto.email))
                throw new HttpException('Please provide a valid email address', HttpStatus.BAD_REQUEST);



            return await this.ideasService.enhanceIdea({ idea: dto.idea.trim(), sendEmail: dto.sendEmail, email: dto.email });

        } catch (error) {

            throw new HttpException(
                error.message || 'Failed to enhance idea',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
