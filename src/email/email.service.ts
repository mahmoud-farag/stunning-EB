import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EnhancedIdea } from 'src/common/interfaces';

@Injectable()
export class EmailService {

    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;


    constructor(private configService: ConfigService) {

        const emailAddress = this.configService.get<string>('EMAIL_ADDRESS');
        const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
        const emailHost = this.configService.get<string>('EMAIL_HOST');
        const emailPort = this.configService.get<number>('EMAIL_PORT');

        if (emailAddress && emailPassword && emailHost && emailPort) {
            this.transporter = nodemailer.createTransport({
                host: emailHost,
                port: emailPort,
                secure: emailPort === 465,
                auth: {
                    user: emailAddress,
                    pass: emailPassword,
                },
            });
            this.logger.log('Email service configured successfully');
        } else {
            this.logger.warn('Email service not configured - missing environment variables');
        }
    }

    async sendEnhancedIdea( params : {to: string, enhanced: EnhancedIdea, original: string }): Promise<void> {
        
        const { to, enhanced, original } = params ?? {};

        if (!this.transporter) 
            throw new Error('Email service not configured');
        

        const emailAddress = this.configService.get<string>('EMAIL_ADDRESS');

        const htmlContent = this.buildEmailTemplate(enhanced, original);

        try {

            await this.transporter.sendMail({ from: `"IdeaBoost" <${emailAddress}>`, to, subject: 'Your Enhanced Website Idea is Ready!', html: htmlContent });
            
            this.logger.log(`Enhanced idea email sent successfully to ${to}`);
            
        } catch (error) {

            this.logger.error(`Failed to send email to ${to}`, error);

            throw new Error('Failed to send email. Please try again.');
        }
    }

    private buildEmailTemplate(enhanced: EnhancedIdea, original: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Enhanced Idea</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
                    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .original-idea { background: #f3f4f6; padding: 20px; margin: 24px; border-radius: 12px; border-left: 4px solid #764ba2; }
                    .original-idea p { margin: 0; color: #4b5563; font-style: italic; }
                    .section { padding: 0 24px 24px; }
                    .section h2 { color: #1a1a2e; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
                    .section p { color: #4b5563; line-height: 1.6; }
                    .feature-list { list-style: none; padding: 0; }
                    .feature-list li { background: #f9fafb; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; color: #374151; }
                    .tech-list li { background: #eff6ff; border: 1px solid #dbeafe; color: #1e40af; }
                    .step-number { display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; margin-right: 8px; }
                    .footer { text-align: center; padding: 24px; background: #f9fafb; color: #9ca3af; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Your Enhanced Website Idea</h1>
                    </div>
                    
                    <div class="original-idea">
                        <p><strong>Your Original Idea:</strong></p>
                        <p>"${original}"</p>
                    </div>
                    
                    <div class="section">
                        <h2>🎯 Problem Statement</h2>
                        <p>${enhanced.problemStatement}</p>
                    </div>
                    
                    <div class="section">
                        <h2>👥 Target Audience</h2>
                        <p>${enhanced.targetAudience}</p>
                    </div>
                    
                    <div class="section">
                        <h2>✨ Core Features</h2>
                        <ul class="feature-list">
                            ${enhanced.coreFeatures.map((f, i) => `<li><span class="step-number">${i + 1}</span>${f}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="section">
                        <h2>⚙️ Technical Suggestions</h2>
                        <ul class="feature-list tech-list">
                            ${enhanced.technicalSuggestions.map(t => `<li>💻 ${t}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="section">
                        <h2>🚀 Next Steps</h2>
                        <ul class="feature-list">
                            ${enhanced.nextSteps.map((s, i) => `<li><span class="step-number">${i + 1}</span>${s}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p>Generated by IdeaBoost - Transform your rough ideas into actionable plans</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}
