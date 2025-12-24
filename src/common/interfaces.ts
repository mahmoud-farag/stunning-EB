
export interface EnhancedIdea {
    problemStatement: string;
    targetAudience: string;
    coreFeatures: string[];
    technicalSuggestions: string[];
    nextSteps: string[];
}



export interface EnhanceIdeaResponse {
  original: string;
  enhanced: EnhancedIdea;
  emailSent?: boolean;
}