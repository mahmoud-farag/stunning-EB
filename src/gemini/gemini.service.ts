import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EnhancedIdea } from 'src/common/interfaces';

@Injectable()
export class GeminiService {

    private readonly logger = new Logger(GeminiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {

        const apiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not configured');
            throw new Error('Internal Server error, missing important configs')

        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        }
    }

    async enhanceIdea(idea: string): Promise<EnhancedIdea> {

        try {
            this.logger.log('GeminiService:enhanceIdea:: started');

            if (!this.model)
                throw new Error('The model not set yet.');


            const prompt = this.buildThePrompt(idea);

            const result = await this.model.generateContent(prompt);

            const response = await result.response;

            const text = response.text();

            // Clean and parse the response
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const parsed = JSON.parse(cleanedText);

            return {
                problemStatement: parsed.problemStatement || '',
                targetAudience: parsed.targetAudience || '',
                coreFeatures: Array.isArray(parsed.coreFeatures) ? parsed.coreFeatures : [],
                technicalSuggestions: Array.isArray(parsed.technicalSuggestions) ? parsed.technicalSuggestions : [],
                nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
            };


        } catch (error) {
            this.logger.error('Failed to enhance idea', error);

            if (error.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else {

                throw new Error('Failed to process your idea. Please try again.');
            }
        }
    }


    private buildThePrompt(idea: string) {

        const prompt = `You are an expert product strategist and UX designer. A user has a rough website idea and needs help turning it into a clear, actionable plan.

        User's rough idea: "${idea}"

        Transform this into a structured plan. Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
        {
        "problemStatement": "A clear 1-2 sentence description of what problem this website solves",
        "targetAudience": "Who specifically will use this website and why",
        "coreFeatures": [
            "Feature 1: Brief description",
            "Feature 2: Brief description",
            "Feature 3: Brief description",
            "Feature 4: Brief description",
            "Feature 5: Brief description"
        ],
        "technicalSuggestions": [
            "Tech suggestion 1",
            "Tech suggestion 2",
            "Tech suggestion 3"
        ],
        "nextSteps": [
            "Step 1: Actionable first step",
            "Step 2: Second actionable step",
            "Step 3: Third actionable step",
            "Step 4: Fourth actionable step",
            "Step 5: Fifth actionable step"
        ]
        }

        Make sure each feature and step is practical, specific, and actionable. Be creative but realistic.`;


        return prompt;

    }
}
