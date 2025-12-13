import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Source {
  title: string;
  url?: string;
  excerpt?: string;
}

interface ChoicePoint {
  question: string;
  options: {
    label: string;
    description: string;
  }[];
  onSelect: (optionIndex: number) => void;
}

interface ChatCanvasProps {
  title: string;
  subtitle?: string;
  canvasContent: string;
  sources?: Source[];
  choicePoints?: ChoicePoint[];
  onSendMessage: (message: string) => Promise<string>;
  onApprove?: () => void;
  approveLabel?: string;
  isLoading?: boolean;
  initialMessages?: Message[];
}

export default function ChatCanvas({
  title,
  subtitle,
  canvasContent,
  sources = [],
  choicePoints = [],
  onSendMessage,
  onApprove,
  approveLabel = 'Godkann',
  isLoading = false,
  initialMessages = [],
}: ChatCanvasProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSending(true);

    try {
      const response = await onSendMessage(userMessage.content);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Chat Panel - Left Side */}
      <div className="w-[400px] flex flex-col border-r border-gray-100">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1d1d1f]">Content Architect</h3>
              <p className="text-xs text-[#86868b]">Tillganglig for fragor och feedback</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[#86868b] text-sm">
                Stall fragor eller ge feedback pa innehallet till hoger.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#f5f5f7] text-[#1d1d1f]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-[#f5f5f7] rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-[#fafafa]">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stall en fraga..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white text-sm"
              rows={2}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="px-4 bg-[#007AFF] text-white rounded-xl hover:bg-[#0066d6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Panel - Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header */}
        <div className="p-4 border-b border-gray-100 bg-[#fafafa] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#1d1d1f]">{title}</h2>
            {subtitle && <p className="text-xs text-[#86868b]">{subtitle}</p>}
          </div>
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {approveLabel}
            </button>
          )}
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Choice Points */}
          {choicePoints.length > 0 && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-100">
              {choicePoints.map((choice, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <p className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    {choice.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {choice.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => choice.onSelect(optIdx)}
                        className="p-3 bg-white border border-yellow-200 rounded-xl text-left hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                      >
                        <p className="font-medium text-sm text-[#1d1d1f]">
                          {option.label}
                        </p>
                        <p className="text-xs text-[#86868b] mt-1">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{canvasContent}</ReactMarkdown>
            </div>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-[#fafafa]">
              <h4 className="font-medium text-[#1d1d1f] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Källor
              </h4>
              <div className="space-y-2">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-gray-100 rounded-xl"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[#86868b] mt-0.5">[{idx + 1}]</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-[#1d1d1f]">
                          {source.title}
                        </p>
                        {source.excerpt && (
                          <p className="text-xs text-[#86868b] mt-1 line-clamp-2">
                            {source.excerpt}
                          </p>
                        )}
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#007AFF] hover:underline mt-1 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visa källa
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
