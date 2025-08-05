import OpenAI from 'openai';
import { IMessage } from '../models/Session';

class AIService {
  private openai!: OpenAI;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      this.isConfigured = true;
    } else {
      console.warn('OpenAI API key not found. AI responses will be mocked.');
    }
  }

  /**
   * Generate AI tutor response based on conversation context
   */
  async generateResponse(
    messages: IMessage[],
    userName: string,
    aiTutorName: string,
    language: string = 'English',
    subject?: string
  ): Promise<string> {
    if (!this.isConfigured) {
      return this.generateMockResponse(messages, userName, aiTutorName);
    }

    try {
      // Build conversation context
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Create system prompt for AI tutor
      const systemPrompt = this.createSystemPrompt(userName, aiTutorName, language, subject);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...conversationHistory
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return response.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateMockResponse(messages, userName, aiTutorName);
    }
  }

  /**
   * Create system prompt for AI tutor
   */
  private createSystemPrompt(
    userName: string,
    aiTutorName: string,
    language: string,
    subject?: string
  ): string {
    return `You are ${aiTutorName}, a knowledgeable and patient AI tutor. You are having a tutoring session with ${userName}.

Key Guidelines:
1. Always address ${userName} by their name
2. Respond in ${language} language
3. Be encouraging, supportive, and patient
4. Provide clear, step-by-step explanations
5. Ask follow-up questions to ensure understanding
6. Use examples and analogies when helpful
7. If ${userName} uploads documents, reference them in your explanations
8. Keep responses concise but comprehensive
9. Maintain a conversational, friendly tone

${subject ? `Current subject: ${subject}` : ''}

Remember: You are here to help ${userName} learn and understand concepts effectively.`;
  }

  /**
   * Generate mock response when OpenAI is not configured
   */
  private generateMockResponse(
    messages: IMessage[],
    userName: string,
    aiTutorName: string
  ): string {
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || lastMessage.sender === 'ai') {
      return `Hello ${userName}! I'm ${aiTutorName}, your AI tutor. How can I help you today?`;
    }

    const userMessage = lastMessage.content.toLowerCase();
    
    // Simple keyword-based responses
    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      return `Hello ${userName}! Great to see you! What would you like to learn about today?`;
    }
    
    if (userMessage.includes('math') || userMessage.includes('mathematics')) {
      return `Mathematics is a fascinating subject, ${userName}! What specific topic are you working on? I'd be happy to help you understand it better.`;
    }
    
    if (userMessage.includes('science')) {
      return `Science is all about understanding the world around us, ${userName}! Which branch of science are you studying?`;
    }
    
    if (userMessage.includes('thank')) {
      return `You're very welcome, ${userName}! I'm here to help you succeed. Is there anything else you'd like to explore?`;
    }
    
    if (userMessage.includes('help')) {
      return `Of course, ${userName}! I'm here to help you. Could you tell me more specifically what you're struggling with?`;
    }
    
    // Default response
    return `That's an interesting question, ${userName}! I'd be happy to help you understand this better. Could you provide a bit more context so I can give you the most helpful response?`;
  }

  /**
   * Analyze uploaded document content (placeholder for future implementation)
   */
  async analyzeDocument(documentPath: string): Promise<string> {
    // This would integrate with document processing services
    // For now, return a placeholder
    return `I've reviewed the document you uploaded. I can help you understand the key concepts and answer any questions you have about it.`;
  }
}

export default new AIService(); 