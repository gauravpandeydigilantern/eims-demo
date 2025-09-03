import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Mic, User, Lightbulb, AlertTriangle, MapPin, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface AIInsight {
  type: 'prediction' | 'alert' | 'optimization' | 'weather';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deviceId?: string;
  region?: string;
}

const quickQueries = [
  { label: "Show down devices", query: "Show me all down devices" },
  { label: "Mumbai status", query: "What's the status in Mumbai?" },
  { label: "High CPU devices", query: "Which devices have high CPU usage?" },
  { label: "Weekly trends", query: "Show me this week's performance trends" },
  { label: "Weather impact", query: "Any weather-related issues?" },
  { label: "Vendor comparison", query: "Compare vendor performance" }
];

export default function AIAssistantPanel() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch AI sessions and insights
  const { data: aiInsights } = useQuery<AIInsight[]>({
    queryKey: ["/api/ai/insights"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId: user?.id })
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response || "I'm here to help! Try asking about device status, analytics, or troubleshooting.",
        timestamp: new Date(),
        actions: data.actions || []
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(input);
    setInput("");
  };

  const handleQuickQuery = (query: string) => {
    setInput(query);
    handleSendMessage();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      case 'weather': return <MapPin className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: `👋 Hello ${user?.firstName || 'there'}! I'm your EIMS AI Assistant. I can help you with device monitoring, analytics, troubleshooting, and insights. What would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [user]);

  return (
    <div className="space-y-4">
      {/* AI Insights Panel */}
      {aiInsights && aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>AI Insights</span>
              <Badge variant="secondary">{aiInsights.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className={`p-1 rounded ${getPriorityColor(insight.priority)} text-white`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{insight.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{insight.description}</div>
                  {insight.region && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {insight.region}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>AI Assistant</span>
            {sendMessageMutation.isPending && (
              <Badge variant="outline" className="ml-auto">
                Thinking...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Query Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickQueries.slice(0, 4).map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuery(query.query)}
                className="text-xs"
                data-testid={`button-quick-query-${index}`}
              >
                {query.label}
              </Button>
            ))}
          </div>

          {/* Chat Messages */}
          <ScrollArea className="h-[300px] w-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted text-foreground mr-4'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'assistant' && (
                        <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant || "outline"}
                            size="sm"
                            className="text-xs"
                            data-testid={`button-action-${action.action}`}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your devices..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sendMessageMutation.isPending}
              data-testid="input-ai-chat"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || sendMessageMutation.isPending}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsListening(!isListening)}
              className={isListening ? 'bg-red-100 text-red-600' : ''}
              data-testid="button-voice-input"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>

          {/* Voice Input Indicator */}
          {isListening && (
            <div className="flex items-center justify-center space-x-2 text-sm text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span>Listening...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}