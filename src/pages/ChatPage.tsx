import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useAllData, useSendCommand } from "@/hooks/useKingAI";
import { Crown, Sparkles, WifiOff, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  thinking?: string;
  timestamp: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all data from backend (includes chat history and CEO status)
  const { data: allData, isLoading, isError, error } = useAllData({ refetchInterval: 10000 });
  
  // Command mutation
  const sendCommand = useSendCommand();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from backend on initial load
  useEffect(() => {
    if (allData?.chat && messages.length === 0) {
      const backendMessages: Message[] = allData.chat.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit" 
        }),
      }));
      if (backendMessages.length > 0) {
        setMessages(backendMessages);
      }
    }
  }, [allData?.chat, messages.length]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: `m${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Send command to the real backend
      const response = await sendCommand.mutateAsync(content);

      const aiMessage: Message = {
        id: `m${Date.now() + 1}`,
        role: "ai",
        content: response.reply || "I received your command but couldn't generate a response.",
        thinking: response.thoughts || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `m${Date.now() + 1}`,
        role: "ai",
        content: `Error connecting to King AI backend: ${err instanceof Error ? err.message : 'Unknown error'}. Please ensure the server is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const isConnected = !isError && !isLoading;
  const ceoMode = allData?.ceoStatus?.mode || 'Unknown';

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-glow">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold gold-text">
                  King AI Command Interface
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-success" />
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      Connected to EC2 Backend
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-destructive" />
                      <span className="text-destructive">Disconnected</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? `Mode: ${ceoMode}` : 'Offline'}
              </Badge>
              {allData?.ceoStatus?.activeBusiness && (
                <Badge variant="outline">
                  Active: {allData.ceoStatus.activeBusiness.name}
                </Badge>
              )}
            </div>
          </div>
          
          {isError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Cannot connect to King AI backend at EC2. Error: {error?.message || 'Connection failed'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ensure the server is running at http://ec2-18-218-174-196.us-east-2.compute.amazonaws.com:3847
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Crown className="w-16 h-16 text-primary/30 mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                Command the Empire
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Send commands to King AI to manage your businesses, approve tasks, 
                or get insights about your autonomous empire.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              thinking={message.thinking}
              timestamp={message.timestamp}
            />
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="chat-bubble-ai flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">King AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border">
          <ChatInput onSend={handleSend} disabled={isTyping} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
