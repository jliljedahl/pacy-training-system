import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, ArrowRight, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Brief {
  status: string;
  brief: {
    projectName: string;
    learningObjectives: string;
    targetAudience: string;
    desiredOutcomes: string;
    deliverables: string;
    language: string;
    particularAngle?: string;
    constraints?: string;
    strictFidelity?: boolean;
  };
  suggestedStructure?: {
    estimatedChapters: number;
    chapters: Array<{
      name: string;
      description: string;
    }>;
  };
}

export default function InterviewChat() {
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [brief, setBrief] = useState<Brief | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasStartedRef = useRef(false);

  // Get company context from previous step
  const companyContextStr = sessionStorage.getItem('companyContext');
  const companyContext = companyContextStr ? JSON.parse(companyContextStr) : null;

  // Start interview on mount (with StrictMode protection)
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input after assistant responds
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const startInterview = async () => {
    setLoading(true);
    await sendMessage('', true);
    setLoading(false);
  };

  const sendMessage = async (text: string, isInitial = false) => {
    if (!isInitial && text.trim()) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    }

    setLoading(true);
    setStreamingContent('');

    try {
      const token = await getAccessToken();
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          message: text,
          companyContext,
          isInitial,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                assistantMessage += data.content;
                setStreamingContent(assistantMessage);
              } else if (data.type === 'complete') {
                setBrief(data.brief);
              } else if (data.type === 'done') {
                // Finalize the message
                if (assistantMessage) {
                  setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
                  setStreamingContent('');
                }
              } else if (data.type === 'error') {
                console.error('Stream error:', data.message);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ett fel uppstod. Försök igen.'
      }]);
    } finally {
      setLoading(false);
      setStreamingContent('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input;
    setInput('');
    sendMessage(message);
  };

  const handleCreateProject = () => {
    if (brief) {
      sessionStorage.setItem('interviewBrief', JSON.stringify(brief));
      navigate('/projects/new');
    }
  };

  const handleStartOver = () => {
    setMessages([]);
    setBrief(null);
    sessionStorage.removeItem('companyContext');
    navigate('/onboarding');
  };

  // Helper to render message content (strip JSON blocks from display)
  const renderMessageContent = (content: string) => {
    // Remove JSON code blocks from display (they're handled separately as brief)
    return content.replace(/```json[\s\S]*?```/g, '').trim();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="py-6 px-4">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">
          Berätta om din utbildning
        </h1>
        <p className="text-[#86868b] mt-1">
          Jag ställer några frågor för att förstå dina behov.
          {companyContext && (
            <span className="text-[#007AFF]"> ({companyContext.company?.name})</span>
          )}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {messages.map((msg, idx) => {
          const displayContent = renderMessageContent(msg.content);
          if (!displayContent) return null;

          return (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-[#007AFF]" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#f5f5f7] text-[#1d1d1f]'
                }`}
              >
                <p className="whitespace-pre-wrap">{displayContent}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          );
        })}

        {/* Streaming content */}
        {streamingContent && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#f5f5f7] text-[#1d1d1f]">
              <p className="whitespace-pre-wrap">{renderMessageContent(streamingContent)}</p>
              <span className="inline-block w-1.5 h-4 bg-[#007AFF] animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-[#f5f5f7]">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Brief Ready Banner */}
      {brief && (
        <div className="mx-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Briefen är klar!</p>
              <p className="text-sm text-green-700">
                {brief.brief.projectName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStartOver}
                className="px-4 py-2 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Börja om
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                Skapa projekt
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={brief ? 'Briefen är klar - klicka "Skapa projekt"' : 'Skriv ditt svar...'}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-[#fafafa] focus:bg-white focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all disabled:opacity-50"
            disabled={loading || !!brief}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !!brief}
            className="px-4 py-3 bg-[#007AFF] text-white rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
