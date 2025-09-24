import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatbotProps {
  className?: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL;

// FAQ Knowledge Base for CivicEye
const FAQ_CONTEXT = `
You are CivicBot, a helpful assistant for CivicEye - a civic issue reporting platform. You help citizens with questions about:

COMMON TOPICS:
1. How to report civic issues (roads, waste, utilities, safety, environment)
2. Issue status tracking and updates
3. Account management and profile settings
4. Using the live map and heatmap features
5. Understanding severity scores and priority levels
6. Department routing and response times
7. Community engagement and hype points
8. Announcements and notifications
9. Voice reporting and accessibility features
10. Image verification and GPS location

QUICK ANSWERS:
- To report an issue: Go to "Report New Issue" → Add photo → Fill details → Submit
- Check issue status: Visit "My Profile" to see all your reported issues
- Live Map: Shows real-time civic issues with heatmap visualization
- Severity scoring: AI automatically rates issue urgency (1-10 scale)
- Voice reporting: Use voice-to-text feature with auto-translation support
- Departments: Issues auto-route to correct departments (Public Works, Sanitation, etc.)
- Hype points: Community engagement metric for issue popularity
- Announcements: Check latest updates from local authorities

RESPONSE STYLE:
- Be helpful, friendly, and concise
- Use simple language
- Provide step-by-step instructions when needed
- Suggest relevant features
- If unsure, direct to contact support

Always stay focused on CivicEye platform features and civic issue reporting.
`;

const SUGGESTED_QUESTIONS = [
  "How do I report a new issue?",
  "How can I track my reported issues?",
  "What is the live map feature?",
  "How does AI severity scoring work?",
  "How do I use voice reporting?",
  "What are hype points?",
];

const Chatbot: React.FC<ChatbotProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm CivicBot 🤖 I'm here to help you with questions about reporting civic issues, using the platform, and more. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: "typing",
      text: "CivicBot is typing...",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await getBotResponse(text);
      
      // Remove typing indicator and add actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== "typing");
        return [...filtered, {
          id: Date.now().toString(),
          text: response,
          sender: "bot",
          timestamp: new Date(),
        }];
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== "typing");
        return [...filtered, {
          id: Date.now().toString(),
          text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact our support team for immediate assistance.",
          sender: "bot",
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBotResponse = async (userMessage: string): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      return "I'm currently offline for maintenance. Please check our FAQ section or contact support for assistance.";
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${FAQ_CONTEXT}\n\nUser Question: ${userMessage}\n\nProvide a helpful, concise response (max 200 words):`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!botResponse) {
        throw new Error("No response from API");
      }

      return botResponse.trim();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      text: "Hi! I'm CivicBot 🤖 I'm here to help you with questions about reporting civic issues, using the platform, and more. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    }]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`mb-4 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden ${
              isMinimized ? "w-80 h-16" : "w-96 h-[500px]"
            } transition-all duration-300`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">CivicBot</h3>
                    <p className="text-xs text-green-100">Always here to help</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setIsMinimized(!isMinimized)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={clearChat}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 p-4 h-80 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-[80%] ${
                          message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.sender === "user" 
                              ? "bg-green-600 text-white" 
                              : "bg-white border-2 border-green-200 text-green-600"
                          }`}>
                            {message.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          <div className={`rounded-2xl px-4 py-2 ${
                            message.sender === "user"
                              ? "bg-green-600 text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}>
                            {message.isTyping ? (
                              <div className="flex items-center space-x-1">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                <div className={`flex items-center mt-1 text-xs ${
                                  message.sender === "user" ? "text-green-100" : "text-gray-500"
                                }`}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTime(message.timestamp)}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Questions */}
                  {messages.length === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="mt-6"
                    >
                      <p className="text-sm text-gray-600 mb-3 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-green-600" />
                        Quick questions to get you started:
                      </p>
                      <div className="space-y-2">
                        {SUGGESTED_QUESTIONS.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedQuestion(question)}
                            className="w-full text-left p-3 text-sm bg-white border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask me anything about CivicEye..."
                      className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4"
                      disabled={isLoading || !inputMessage.trim()}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default Chatbot;
