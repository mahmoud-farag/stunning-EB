import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { EmailService } from '../email/email.service';
import {EnhanceIdeaResponse } from 'src/common/interfaces';


@Injectable()
export class IdeasService {

    private readonly logger = new Logger(GeminiService.name);

    constructor(private readonly geminiService: GeminiService, private readonly emailService: EmailService) { }

    async enhanceIdea(params : { idea: string, sendEmail?: boolean, email: string | undefined} ): Promise <EnhanceIdeaResponse> {
        
        this.logger.log('IdeasService:enhanceIdea:: started');


        const  { idea, sendEmail, email } = params ?? {};
        let emailSent = false;

        const enhanced = await this.geminiService.enhanceIdea(idea);

        // Send email if requested
        if (sendEmail && email) {
            try {

                await this.emailService.sendEnhancedIdea({ to: email, enhanced, original: idea });
                emailSent = true;

            } catch(error) {

                // just log the error details, for debugging purpose;
                this.logger.error('Failed to send email:\n', error);
            }

        }

        return { original: idea, enhanced, emailSent };

        
    }
}
