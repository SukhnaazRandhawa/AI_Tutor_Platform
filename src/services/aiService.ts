import OpenAI from 'openai';
import { IMessage } from '../models/Session';

class AIService {
  private openai!: OpenAI;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🔍 AI Service - Checking OpenAI API key...');
    console.log('🔍 API Key exists:', !!apiKey);
    console.log('🔍 API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      this.isConfigured = true;
      console.log('✅ OpenAI API configured successfully');
    } else {
      console.warn('⚠️ OpenAI API key not found or invalid. AI responses will be mocked.');
      console.warn('⚠️ Please check your .env file and ensure OPENAI_API_KEY is set correctly.');
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
    console.log('🤖 Generating AI response...');
    console.log('🤖 Using OpenAI:', this.isConfigured);
    console.log('🤖 User:', userName);
    console.log('🤖 Tutor:', aiTutorName);
    console.log('🤖 Language:', language);
    console.log('🤖 Subject:', subject);
    
    if (!this.isConfigured) {
      console.log('⚠️ Using mock response (OpenAI not configured)');
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

      console.log('🤖 Sending request to OpenAI...');
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

      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.';
      console.log('✅ OpenAI response received:', aiResponse.substring(0, 100) + '...');
      return aiResponse;
    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      console.log('⚠️ Falling back to mock response');
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
10. When teaching concepts like logistic regression, provide practical examples and clear explanations

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
    
    if (userMessage.includes('logistic regression')) {
      return `Great question, ${userName}! Logistic regression is a statistical method used for binary classification. It predicts the probability of an event occurring. For example, it can predict whether an email is spam (1) or not spam (0) based on features like word frequency, sender information, etc. Would you like me to explain more about how it works?`;
    }
    
    if (userMessage.includes('example')) {
      return `Here's a practical example, ${userName}: Imagine you're a bank trying to predict if a customer will default on a loan. You'd use logistic regression with features like credit score, income, loan amount, and employment history to predict the probability of default. The model outputs a probability between 0 and 1, and you can set a threshold (like 0.5) to classify customers as likely to default or not.`;
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