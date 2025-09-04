import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  MapPin, 
  AlertTriangle, 
  Wrench, 
  BarChart3,
  Brain,
  Lightbulb,
  Clock,
  TrendingUp,
  Zap,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: string[];
    suggestions?: string[];
    data?: any;
  };
}

interface DeviceQuery {
  devices: Array<{
    id: string;
    location: string;
    status: string;
    lastSeen: string;
  }>;
  count: number;
  region?: string;
}

interface PredictiveInsight {
  type: 'maintenance' | 'performance' | 'failure';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export default function EnhancedAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your enhanced EIMS AI assistant. I can help you with device queries, predictive insights, maintenance recommendations, and performance analysis. Try asking me something like 'Show me down devices in Mumbai' or 'What maintenance is due this week?'",
      timestamp: new Date(),
      metadata: {
        suggestions: [
          'Show me down devices in Mumbai',
          'What maintenance is due this week?',
          'Analyze performance trends',
          'Predict device failures'
        ]
      }
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(typeof window !== 'undefined' && 'webkitSpeechRecognition' in window);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (voiceSupported) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: 'Voice Recognition Error',
          description: 'Could not recognize speech. Please try again.',
          variant: 'destructive',
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [voiceSupported, toast]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const analyzeQuery = (query: string): { intent: string; entities: string[]; confidence: number } => {
    const queryLower = query.toLowerCase();
    
    // Intent classification
    let intent = 'general';
    let confidence = 0.5;
    
    if (queryLower.includes('down') || queryLower.includes('offline') || queryLower.includes('not working')) {
      intent = 'device_status';
      confidence = 0.9;
    } else if (queryLower.includes('maintenance') || queryLower.includes('repair') || queryLower.includes('service')) {
      intent = 'maintenance';
      confidence = 0.9;
    } else if (queryLower.includes('performance') || queryLower.includes('analytics') || queryLower.includes('trends')) {
      intent = 'analytics';
      confidence = 0.85;
    } else if (queryLower.includes('predict') || queryLower.includes('forecast') || queryLower.includes('future')) {
      intent = 'prediction';
      confidence = 0.8;
    }

    // Entity extraction
    const entities: string[] = [];
    const regions = ['mumbai', 'delhi', 'bangalore', 'chennai', 'pune', 'ahmedabad', 'kolkata'];
    const vendors = ['bcil', 'zebra', 'imp', 'anj'];
    const statuses = ['down', 'live', 'maintenance', 'warning'];

    regions.forEach(region => {
      if (queryLower.includes(region)) entities.push(`region:${region}`);
    });
    
    vendors.forEach(vendor => {
      if (queryLower.includes(vendor)) entities.push(`vendor:${vendor}`);
    });
    
    statuses.forEach(status => {
      if (queryLower.includes(status)) entities.push(`status:${status}`);
    });

    return { intent, entities, confidence };
  };

  const generateResponse = async (query: string, analysis: any): Promise<{ content: string; metadata?: any }> => {
    const { intent, entities } = analysis;
    
    switch (intent) {
      case 'device_status':
        return await handleDeviceStatusQuery(query, entities);
      case 'maintenance':
        return await handleMaintenanceQuery(query, entities);
      case 'analytics':
        return await handleAnalyticsQuery(query, entities);
      case 'prediction':
        return await handlePredictionQuery(query, entities);
      default:
        return {
          content: "I understand you're asking about the EIMS system. Could you be more specific? I can help with device status, maintenance schedules, performance analytics, or predictive insights.",
          metadata: {
            suggestions: [
              'Show me device status',
              'What maintenance is needed?',
              'Show performance trends',
              'Predict potential issues'
            ]
          }
        };
    }
  };

  const handleDeviceStatusQuery = async (query: string, entities: string[]): Promise<{ content: string; metadata?: any }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const region = entities.find(e => e.startsWith('region:'))?.split(':')[1];
    const status = entities.find(e => e.startsWith('status:'))?.split(':')[1];
    
    // Mock device data
    const mockDevices = [
      { id: 'RF001_MUM', location: 'Mumbai Port', status: 'DOWN', lastSeen: '2 hours ago' },
      { id: 'RF023_MUM', location: 'Mumbai Station', status: 'DOWN', lastSeen: '1.5 hours ago' },
      { id: 'RF045_MUM', location: 'Mumbai Warehouse', status: 'DOWN', lastSeen: '3 hours ago' },
    ];

    const responseContent = region 
      ? `Found ${mockDevices.length} down devices in ${region.charAt(0).toUpperCase() + region.slice(1)}:\n\n${mockDevices.map(d => `• ${d.id} at ${d.location} (down for ${d.lastSeen})`).join('\n')}\n\nRecommendation: Schedule immediate maintenance for these devices.`
      : `Here's the current device status overview:\n\n• Total devices: 5,120\n• Live: 4,987 (97.4%)\n• Down: 45 (0.9%)\n• Warning: 73 (1.4%)\n• Maintenance: 15 (0.3%)\n\nWould you like details for a specific region?`;

    return {
      content: responseContent,
      metadata: {
        intent: 'device_status',
        data: { devices: mockDevices, region },
        suggestions: ['Show device locations on map', 'Schedule maintenance', 'Get detailed device info']
      }
    };
  };

  const handleMaintenanceQuery = async (query: string, entities: string[]): Promise<{ content: string; metadata?: any }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockMaintenance = [
      { device: 'RF012_DEL', type: 'Preventive', scheduled: 'Tomorrow 10:00 AM', priority: 'High' },
      { device: 'RF034_BLR', type: 'Corrective', scheduled: 'Sep 6, 2:00 PM', priority: 'Medium' },
      { device: 'RF067_CHN', type: 'Preventive', scheduled: 'Sep 8, 9:00 AM', priority: 'Low' },
    ];

    const content = `Upcoming maintenance schedule:\n\n${mockMaintenance.map(m => 
      `• ${m.device}: ${m.type} maintenance\n  Scheduled: ${m.scheduled}\n  Priority: ${m.priority}`
    ).join('\n\n')}\n\nProactive maintenance recommendations:\n• 23 devices approaching maintenance threshold\n• 5 devices showing early warning signs\n• Optimal maintenance window: Sep 10-12 (low traffic period)`;

    return {
      content,
      metadata: {
        intent: 'maintenance',
        data: { schedule: mockMaintenance },
        suggestions: ['View maintenance calendar', 'Optimize maintenance schedule', 'Get technician availability']
      }
    };
  };

  const handleAnalyticsQuery = async (query: string, entities: string[]): Promise<{ content: string; metadata?: any }> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const content = `📊 Performance Analytics Summary:\n\n🔹 System Uptime: 99.2% (↑0.3% from last month)\n🔹 Transaction Success Rate: 97.8% (↓0.5% from last month)\n🔹 Average Response Time: 1.2s (↓0.2s improvement)\n🔹 Device Availability: 98.9% (stable)\n\n📈 Key Trends:\n• Mumbai region showing 15% efficiency improvement\n• BCIL devices outperforming by 3.2%\n• Peak usage hours: 2-6 PM (87% load)\n• Weekend performance 5% better than weekdays\n\n🎯 Recommendations:\n• Implement load balancing during peak hours\n• Scale Mumbai region success to other areas\n• Investigate transaction failure root causes`;

    return {
      content,
      metadata: {
        intent: 'analytics',
        suggestions: ['View detailed analytics dashboard', 'Export performance report', 'Set up performance alerts']
      }
    };
  };

  const handlePredictionQuery = async (query: string, entities: string[]): Promise<{ content: string; metadata?: any }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const predictions: PredictiveInsight[] = [
      {
        type: 'failure',
        title: 'High Failure Risk Detected',
        description: '23 devices in Mumbai zone showing degraded performance patterns',
        confidence: 89,
        timeframe: '7-10 days',
        impact: 'high',
        recommendation: 'Schedule preventive maintenance immediately'
      },
      {
        type: 'performance',
        title: 'Performance Degradation Trend',
        description: 'Transaction processing time increasing in Delhi region',
        confidence: 76,
        timeframe: '2-3 weeks',
        impact: 'medium',
        recommendation: 'Optimize network configuration and update firmware'
      },
      {
        type: 'maintenance',
        title: 'Optimal Maintenance Window',
        description: 'Best maintenance scheduling opportunity identified',
        confidence: 95,
        timeframe: 'September 10-12',
        impact: 'low',
        recommendation: 'Schedule routine maintenance during identified window'
      }
    ];

    const content = `🔮 Predictive Insights & Forecasts:\n\n${predictions.map(p => 
      `${getInsightEmoji(p.type)} ${p.title}\n   Confidence: ${p.confidence}%\n   Timeframe: ${p.timeframe}\n   Impact: ${p.impact.toUpperCase()}\n   💡 ${p.recommendation}`
    ).join('\n\n')}\n\n🧠 ML Model Performance:\n• Prediction accuracy: 91.2%\n• Data points analyzed: 2.4M+\n• Pattern recognition: 15 failure signatures identified\n• Next model update: September 15`;

    return {
      content,
      metadata: {
        intent: 'prediction',
        data: { predictions },
        suggestions: ['View detailed predictions', 'Set up proactive alerts', 'Schedule recommended actions']
      }
    };
  };

  const getInsightEmoji = (type: string): string => {
    switch (type) {
      case 'failure': return '🚨';
      case 'performance': return '📉';
      case 'maintenance': return '🔧';
      default: return '📊';
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Analyze user query
      const analysis = analyzeQuery(inputMessage);
      
      // Generate AI response
      const response = await generateResponse(inputMessage, analysis);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          intent: analysis.intent,
          entities: analysis.entities,
          ...response.metadata
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'device_status': return <MapPin className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'analytics': return <BarChart3 className="w-4 h-4" />;
      case 'prediction': return <Brain className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Enhanced AI Assistant
        </CardTitle>
        <CardDescription>
          Natural language queries, predictive insights, and intelligent recommendations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                  <div className="flex items-start gap-2">
                    {message.type === 'ai' && getIntentIcon(message.metadata?.intent)}
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      {message.metadata?.suggestions && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.metadata.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 animate-pulse" />
                    <div className="text-sm">AI is thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />
        
        {/* Input */}
        <div className="p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about devices, maintenance, analytics, or predictions..."
              disabled={isLoading}
              className="flex-1"
            />
            
            {voiceSupported && (
              <Button
                variant="outline"
                size="icon"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={isListening ? 'bg-red-50 text-red-600' : ''}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {['Show device status', 'Maintenance due', 'Performance trends', 'Predict failures'].map((quickQuery) => (
              <Button
                key={quickQuery}
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleSuggestionClick(quickQuery)}
                disabled={isLoading}
              >
                {quickQuery}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
