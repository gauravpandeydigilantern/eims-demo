import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: string[];
  data?: any;
}

export default function AIAssistant() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to help you monitor and manage your RFID devices. You can ask me about device status, generate reports, or get troubleshooting assistance.",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: chatSessions } = useQuery({
    queryKey: ["/api/ai/sessions"],
    refetchInterval: false,
  });

  const chatMutation = useMutation({
    mutationFn: async ({ query, sessionId }: { query: string; sessionId?: string }) => {
      const response = await apiRequest("POST", "/api/ai/chat", { query, sessionId });
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          actions: data.actions,
          data: data.data,
        }
      ]);
      scrollToBottom();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ query: inputValue, sessionId: currentSessionId || undefined });
    setInputValue("");
  };

  const handleQuickQuery = (query: string) => {
    setInputValue(query);
    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ query, sessionId: currentSessionId || undefined });
  };

  const quickSuggestions = [
    "Show system overview",
    "Device health report", 
    "Weather alerts",
    "Down devices in Mumbai",
    "High CPU devices",
    "Generate status report"
  ];

  return (
    <Card>
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="flex flex-col h-96">
          {/* Chat Messages */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto" data-testid="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                
                <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'max-w-xs' : ''}`}>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap" data-testid={`message-${index}`}>
                      {message.content}
                    </div>
                  </div>
                  
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickQuery(action)}
                          data-testid={`button-action-${actionIndex}`}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Thinking...</div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-6 border-t border-border">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Ask me about device status, alerts, or reports..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={chatMutation.isPending}
                  className="flex-1"
                  data-testid="input-chat-message"
                />
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || chatMutation.isPending}
                  data-testid="button-send-message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
              
              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickQuery(suggestion)}
                    disabled={chatMutation.isPending}
                    className="text-xs"
                    data-testid={`button-suggestion-${index}`}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
