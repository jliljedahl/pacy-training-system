import { useState } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatCanvas from './ChatCanvas';

interface ArticleReviewProps {
  article: any;
  session: any;
  chapter: any;
  onApprove: () => void;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
}

export default function ArticleReview({
  article,
  session,
  chapter,
  onApprove,
  onRegenerate,
  isRegenerating = false,
}: ArticleReviewProps) {
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: string; content: string; timestamp: Date }>
  >([]);

  // Clean article content (remove code fences if present)
  const cleanContent = article.content
    .replace(/^```markdown\n/, '')
    .replace(/^```\n/, '')
    .replace(/\n```$/, '');

  // Handle chat messages - for articles, we don't have a streaming chat API yet
  // So we'll just echo back a simple response for now
  const handleSendMessage = async (message: string): Promise<string> => {
    // TODO: Implement article-specific chat endpoint if needed
    // For now, just acknowledge the feedback
    return `Jag har mottagit din feedback: "${message}". Klicka på "Skapa om artikel" för att regenerera artikeln baserat på denna feedback.`;
  };

  // If article is already approved, show simple view
  if (article.approved) {
    return (
      <div className="space-y-6">
        {/* Approved Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                Artikeln är godkänd och klar för publicering.
              </span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Skriv ut
            </button>
          </div>
        </div>

        {/* Simple Article View */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Show Chat + Canvas layout for review
  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#1d1d1f]">Granska artikel: {session.title}</h3>
          <p className="text-sm text-[#86868b]">
            {chapter.title} - Ge feedback eller godkänn artikeln.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Skriv ut
          </button>
        </div>
      </div>

      {/* Chat + Canvas */}
      <ChatCanvas
        title={session.title}
        subtitle={`${article.wordCount || 0} ord - ${chapter.title}`}
        canvasContent={cleanContent}
        sources={[]}
        onSendMessage={handleSendMessage}
        onApprove={onApprove}
        onRegenerate={onRegenerate}
        approveLabel="Godkänn artikel"
        regenerateLabel="Skapa om artikel"
        isRegenerating={isRegenerating}
        initialMessages={[
          {
            id: 'welcome',
            role: 'assistant',
            content: `Jag har skapat artikeln "${session.title}" (${article.wordCount || 0} ord).\n\nGranska innehållet till höger. Du kan ställa frågor eller ge feedback här i chatten. När du är nöjd, klicka "Godkänn artikel". Om du vill att jag skriver om artikeln, beskriv vad du vill ändra och klicka sedan "Skapa om artikel".`,
            timestamp: new Date(),
          },
          ...(article.changeSummary
            ? [
                {
                  id: 'change-summary',
                  role: 'assistant' as const,
                  content: `📝 **Ändringar jag gjorde:**\n\n${article.changeSummary}`,
                  timestamp: new Date(),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
