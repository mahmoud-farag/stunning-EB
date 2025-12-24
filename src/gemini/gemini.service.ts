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

            // Check if the input was valid/understandable
            if (parsed.isValid === false) {
                const errorMessage = parsed.errorMessage || 'Your input doesn\'t appear to be a valid website idea. Please describe what kind of website you want to build.';
                throw new Error(errorMessage);
            }

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
            } else if (error.message && !error.message.includes('Failed to process')) {
                // Re-throw validation errors with their original message
                throw error;
            } else {
                throw new Error('Failed to process your idea. Please try again.');
            }
        }
    }


    private buildThePrompt(idea: string) {

        const prompt = `You are an expert product strategist and UX designer. A user has submitted text claiming to be a website idea, and you need to evaluate and potentially enhance it.

        User's input: "${idea}"

        IMPORTANT: First, evaluate if the input is a coherent, understandable website or app idea. 
        
        If the input is:
        - Random characters, gibberish, or keyboard mashing (e.g., "asdfgh", "dfkkdffeeghryt")
        - Completely unrelated to websites/apps (e.g., just a random word with no context)
        - Too vague to interpret as any kind of idea (e.g., just "hello" or "test")
        - Not in any recognizable language or format
        
        Then respond ONLY with this JSON:
        {
          "isValid": false,
          "errorMessage": "I couldn't understand your idea. Please describe what kind of website or app you'd like to build. For example: 'A recipe sharing platform' or 'An online store for handmade crafts'."
        }

        If the input IS a valid, understandable idea (even if rough or brief), respond with this JSON:
        {
        "isValid": true,
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

        Respond ONLY with valid JSON (no markdown, no code blocks).
        Make sure each feature and step is practical, specific, and actionable. Be creative but realistic.`;


        return prompt;

    }
}
