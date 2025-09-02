import OpenAI from "openai";
import { storage } from "../storage";
import type { AiChatSession } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class AIService {
  async processQuery(
    userId: string,
    query: string,
    sessionId?: string
  ): Promise<{
    response: string;
    actions?: any[];
    data?: any;
    sessionId: string;
  }> {
    // Get or create chat session
    let session: AiChatSession;
    if (sessionId) {
      const sessions = await storage.getUserChatSessions(userId);
      session = sessions.find(s => s.id === sessionId) || await this.createNewSession(userId);
    } else {
      session = await this.createNewSession(userId);
    }

    // Get user context for role-based responses
    const user = await storage.getUser(userId);
    const userRole = user?.role || 'CLIENT';

    // Prepare context with system data
    const systemContext = await this.gatherSystemContext(userRole, query);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(userRole, systemContext)
          },
          ...this.getConversationHistory(session),
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Update session with new messages
      const messages = Array.isArray(session.messages) ? session.messages : [];
      const updatedMessages = [
        ...messages,
        { role: 'user', content: query, timestamp: new Date().toISOString() },
        { role: 'assistant', content: result.response, timestamp: new Date().toISOString() }
      ];

      await storage.updateChatSession(session.id, {
        messages: updatedMessages,
        title: session.title || this.generateSessionTitle(query),
      });

      return {
        response: result.response,
        actions: result.actions,
        data: result.data,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        response: "I'm sorry, I'm experiencing technical difficulties. Please try again or contact support.",
        sessionId: session.id,
      };
    }
  }

  private async createNewSession(userId: string): Promise<AiChatSession> {
    return await storage.createChatSession({
      userId,
      messages: [],
    });
  }

  private getSystemPrompt(userRole: string, systemContext: any): string {
    const basePrompt = `You are an AI assistant for the EIMS (Electronic Infrastructure Management System). You help monitor and manage 5,000+ RFID devices across toll plazas in India.

User Role: ${userRole}

Current System Status:
- Total Devices: ${systemContext.totalDevices}
- Online Devices: ${systemContext.onlineDevices}
- Offline Devices: ${systemContext.offlineDevices}
- Active Alerts: ${systemContext.activeAlerts}

Capabilities based on user role:
${this.getRoleCapabilities(userRole)}

Always respond in JSON format with this structure:
{
  "response": "Your conversational response",
  "actions": ["action_button_1", "action_button_2"], // optional quick action buttons
  "data": {} // optional structured data for charts/tables
}

Be helpful, concise, and provide actionable insights. Include relevant device IDs, locations, and specific metrics when available.`;

    return basePrompt;
  }

  private getRoleCapabilities(role: string): string {
    switch (role) {
      case 'NEC_GENERAL':
        return '- Full system access\n- Device control and configuration\n- User management\n- All reports and analytics';
      case 'NEC_ENGINEER':
        return '- Regional device monitoring\n- Limited device control\n- Regional reports\n- Alert management';
      case 'NEC_ADMIN':
        return '- Device management and control\n- Configuration access\n- Administrative functions\n- System reports';
      case 'CLIENT':
        return '- Read-only dashboard access\n- Basic reporting\n- Status monitoring\n- No control functions';
      default:
        return '- Basic system information';
    }
  }

  private async gatherSystemContext(userRole: string, query: string): Promise<any> {
    // Gather relevant system data based on query and user role
    const devices = await storage.getAllDevices();
    const alerts = await storage.getActiveAlerts();
    
    const onlineDevices = devices.filter(d => d.status === 'LIVE').length;
    const offlineDevices = devices.filter(d => d.status === 'DOWN').length;

    const context = {
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices,
      activeAlerts: alerts.length,
    };

    // Add query-specific context
    if (query.toLowerCase().includes('weather')) {
      context.weather = await storage.getLatestWeatherData();
    }

    if (query.toLowerCase().includes('mumbai') || query.toLowerCase().includes('mum')) {
      context.mumbaiDevices = devices.filter(d => d.region.toLowerCase().includes('mumbai'));
    }

    return context;
  }

  private getConversationHistory(session: AiChatSession): any[] {
    if (!Array.isArray(session.messages)) return [];
    
    // Return last 10 messages for context
    return session.messages
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  private generateSessionTitle(firstQuery: string): string {
    const words = firstQuery.split(' ').slice(0, 5);
    return words.join(' ') + (words.length < firstQuery.split(' ').length ? '...' : '');
  }

  async processDeviceQuery(query: string): Promise<any> {
    // Extract device-related intents and entities
    const intent = this.extractIntent(query);
    const entities = this.extractEntities(query);

    switch (intent) {
      case 'device_status':
        return await this.getDeviceStatus(entities);
      case 'device_control':
        return await this.getDeviceControlSuggestions(entities);
      case 'system_overview':
        return await this.getSystemOverview();
      default:
        return { intent: 'unknown', entities };
    }
  }

  private extractIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('status') || lowerQuery.includes('show') || lowerQuery.includes('list')) {
      return 'device_status';
    }
    if (lowerQuery.includes('reset') || lowerQuery.includes('restart') || lowerQuery.includes('control')) {
      return 'device_control';
    }
    if (lowerQuery.includes('overview') || lowerQuery.includes('summary') || lowerQuery.includes('dashboard')) {
      return 'system_overview';
    }
    
    return 'general_query';
  }

  private extractEntities(query: string): any {
    const entities: any = {};
    
    // Extract regions
    const regions = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
    const foundRegion = regions.find(region => query.toLowerCase().includes(region));
    if (foundRegion) {
      entities.region = foundRegion;
    }

    // Extract device status
    const statuses = ['down', 'offline', 'live', 'online', 'maintenance'];
    const foundStatus = statuses.find(status => query.toLowerCase().includes(status));
    if (foundStatus) {
      entities.status = foundStatus === 'offline' ? 'DOWN' : foundStatus.toUpperCase();
    }

    return entities;
  }

  private async getDeviceStatus(entities: any): Promise<any> {
    let devices = await storage.getAllDevices();

    if (entities.region) {
      devices = devices.filter(d => d.region.toLowerCase().includes(entities.region));
    }

    if (entities.status) {
      devices = devices.filter(d => d.status === entities.status);
    }

    return {
      intent: 'device_status',
      devices: devices.slice(0, 10), // Limit to first 10 for response
      total: devices.length,
      filters: entities,
    };
  }

  private async getDeviceControlSuggestions(entities: any): Promise<any> {
    // Provide control suggestions based on entities
    return {
      intent: 'device_control',
      suggestions: [
        'Reset selected devices',
        'Run diagnostics',
        'Schedule maintenance',
        'Update configuration'
      ],
      entities,
    };
  }

  private async getSystemOverview(): Promise<any> {
    const summary = await storage.getDeviceStatusSummary();
    const alerts = await alertService.getAlertsSummary();
    
    return {
      intent: 'system_overview',
      deviceSummary: summary,
      alertsSummary: alerts,
    };
  }
}

export const aiService = new AIService();
