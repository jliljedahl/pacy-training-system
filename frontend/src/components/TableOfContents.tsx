import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  HelpCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TableOfContentsProps {
  project: any;
  onEditContent?: (type: 'article' | 'video', id: string, currentContent: string) => void;
  onSaveContent?: (type: 'article' | 'video', id: string) => void;
  onEditQuiz?: (quizId: string, questions: any[]) => void;
  onSaveQuiz?: (quizId: string, questions: any[]) => void;
  onCancelEditing?: () => void;
  editingContent?: { type: string; id: string } | null;
  editedContent?: string;
  setEditedContent?: (content: string) => void;
  editingQuiz?: string | null;
  editedQuizQuestions?: any[];
  setEditedQuizQuestions?: (questions: any[]) => void;
}

export default function TableOfContents({
  project,
  onEditContent,
  onSaveContent,
  onEditQuiz,
  onSaveQuiz,
  onCancelEditing,
  editingContent,
  editedContent = '',
  setEditedContent,
  editingQuiz,
  editedQuizQuestions = [],
  setEditedQuizQuestions,
}: TableOfContentsProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  if (!project?.chapters || project.chapters.length === 0) {
    return (
      <div className="text-center py-12 text-[#86868b]">
        <p>Inga kapitel tillgängliga ännu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {project.chapters
        .sort((a: any, b: any) => a.number - b.number)
        .map((chapter: any) => {
          const isChapterExpanded = expandedChapters.has(chapter.id);
          const sessions = chapter.sessions?.sort((a: any, b: any) => a.number - b.number) || [];

          return (
            <div
              key={chapter.id}
              className="border border-gray-200/60 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm subtle-shadow"
            >
              {/* Chapter Header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-[#86868b]">
                    {isChapterExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1d1d1f]">
                      Kapitel {chapter.number}: {chapter.name}
                    </h3>
                    {chapter.description && (
                      <p className="text-sm text-[#86868b] mt-1">{chapter.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#86868b]">
                  <span>{sessions.length} sessioner</span>
                </div>
              </button>

              {/* Chapter Content */}
              {isChapterExpanded && (
                <div className="border-t border-gray-200/60 bg-gray-50/30">
                  <div className="p-4 space-y-2">
                    {sessions.map((session: any) => {
                      const isSessionExpanded = expandedSessions.has(session.id);
                      const hasArticle = !!session.article;
                      const hasVideo = !!session.videoScript;
                      const hasQuiz = !!session.quiz;

                      return (
                        <div
                          key={session.id}
                          className="border border-gray-200/40 rounded-lg overflow-hidden bg-white/70"
                        >
                          {/* Session Header */}
                          <button
                            onClick={() => toggleSession(session.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="text-[#86868b]">
                                {isSessionExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-[#1d1d1f]">
                                  Session {session.number}: {session.name}
                                </h4>
                                {session.wiifm && (
                                  <p className="text-xs text-[#86868b] mt-1">{session.wiifm}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasArticle && (
                                <FileText
                                  className="w-4 h-4 text-green-600"
                                  title="Artikel finns"
                                />
                              )}
                              {hasVideo && (
                                <Video
                                  className="w-4 h-4 text-blue-600"
                                  title="Video-narrativ finns"
                                />
                              )}
                              {hasQuiz && (
                                <HelpCircle
                                  className="w-4 h-4 text-purple-600"
                                  title="Quiz finns"
                                />
                              )}
                            </div>
                          </button>

                          {/* Session Content */}
                          {isSessionExpanded && (
                            <div className="border-t border-gray-200/40 bg-white/90 p-4 space-y-4">
                              {/* Article */}
                              {hasArticle && (
                                <div className="border-l-4 border-green-500 pl-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-sm text-[#1d1d1f] flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-green-600" />
                                      Artikel
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#86868b]">
                                        {session.article.wordCount} ord
                                        {session.article.approved && (
                                          <span className="ml-2 text-green-600">✓ Godkänd</span>
                                        )}
                                      </span>
                                      {onEditContent && (
                                        <button
                                          onClick={() =>
                                            onEditContent(
                                              'article',
                                              session.article.id,
                                              session.article.content
                                            )
                                          }
                                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          Redigera
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {editingContent?.type === 'article' &&
                                  editingContent.id === session.article.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent?.(e.target.value)}
                                        className="w-full min-h-[300px] p-3 border border-gray-300 rounded-lg text-sm font-mono"
                                        placeholder="Redigera artikel i markdown..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            onSaveContent?.('article', session.article.id)
                                          }
                                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                                        >
                                          <Save className="w-4 h-4" />
                                          Spara
                                        </button>
                                        <button
                                          onClick={onCancelEditing}
                                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1 text-sm"
                                        >
                                          <X className="w-4 h-4" />
                                          Avbryt
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="prose prose-slate prose-sm max-w-none break-words overflow-hidden text-[#1d1d1f]">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {session.article.content}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Video Script */}
                              {hasVideo && (
                                <div className="border-l-4 border-blue-500 pl-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-sm text-[#1d1d1f] flex items-center gap-2">
                                      <Video className="w-4 h-4 text-blue-600" />
                                      Video-narrativ
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#86868b]">
                                        {session.videoScript.wordCount} ord
                                        {session.videoScript.approved && (
                                          <span className="ml-2 text-green-600">✓ Godkänd</span>
                                        )}
                                      </span>
                                      {onEditContent && (
                                        <button
                                          onClick={() =>
                                            onEditContent(
                                              'video',
                                              session.videoScript.id,
                                              session.videoScript.content
                                            )
                                          }
                                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          Redigera
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {editingContent?.type === 'video' &&
                                  editingContent.id === session.videoScript.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent?.(e.target.value)}
                                        className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg text-sm font-mono"
                                        placeholder="Redigera video-narrativ i markdown..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            onSaveContent?.('video', session.videoScript.id)
                                          }
                                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                                        >
                                          <Save className="w-4 h-4" />
                                          Spara
                                        </button>
                                        <button
                                          onClick={onCancelEditing}
                                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1 text-sm"
                                        >
                                          <X className="w-4 h-4" />
                                          Avbryt
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="prose prose-slate prose-sm max-w-none break-words overflow-hidden text-[#1d1d1f]">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {session.videoScript.content}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Quiz */}
                              {hasQuiz && (
                                <div className="border-l-4 border-purple-500 pl-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-sm text-[#1d1d1f] flex items-center gap-2">
                                      <HelpCircle className="w-4 h-4 text-purple-600" />
                                      Quiz
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#86868b]">
                                        {session.quiz.questions?.length || 0} frågor
                                        {session.quiz.approved && (
                                          <span className="ml-2 text-green-600">✓ Godkänd</span>
                                        )}
                                      </span>
                                      {onEditQuiz &&
                                        session.quiz.questions &&
                                        session.quiz.questions.length > 0 && (
                                          <button
                                            onClick={() =>
                                              onEditQuiz(session.quiz.id, session.quiz.questions)
                                            }
                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                            Redigera
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                  {editingQuiz === session.quiz.id ? (
                                    <div className="space-y-3">
                                      {editedQuizQuestions.map((q: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="border border-gray-200 rounded-lg p-3 space-y-2"
                                        >
                                          <div>
                                            <label className="text-xs font-medium text-gray-700">
                                              Fråga {idx + 1}
                                            </label>
                                            <textarea
                                              value={q.question}
                                              onChange={(e) => {
                                                const updated = [...editedQuizQuestions];
                                                updated[idx].question = e.target.value;
                                                setEditedQuizQuestions?.(updated);
                                              }}
                                              className="w-full p-2 border border-gray-300 rounded text-sm"
                                              rows={2}
                                            />
                                          </div>
                                          <div className="grid grid-cols-3 gap-2">
                                            <div>
                                              <label className="text-xs font-medium text-gray-700">
                                                A)
                                              </label>
                                              <input
                                                type="text"
                                                value={q.optionA}
                                                onChange={(e) => {
                                                  const updated = [...editedQuizQuestions];
                                                  updated[idx].optionA = e.target.value;
                                                  setEditedQuizQuestions?.(updated);
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs font-medium text-gray-700">
                                                B)
                                              </label>
                                              <input
                                                type="text"
                                                value={q.optionB}
                                                onChange={(e) => {
                                                  const updated = [...editedQuizQuestions];
                                                  updated[idx].optionB = e.target.value;
                                                  setEditedQuizQuestions?.(updated);
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs font-medium text-gray-700">
                                                C)
                                              </label>
                                              <input
                                                type="text"
                                                value={q.optionC}
                                                onChange={(e) => {
                                                  const updated = [...editedQuizQuestions];
                                                  updated[idx].optionC = e.target.value;
                                                  setEditedQuizQuestions?.(updated);
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-xs font-medium text-gray-700">
                                              Rätt svar
                                            </label>
                                            <select
                                              value={q.correctAnswer}
                                              onChange={(e) => {
                                                const updated = [...editedQuizQuestions];
                                                updated[idx].correctAnswer = e.target.value;
                                                setEditedQuizQuestions?.(updated);
                                              }}
                                              className="w-full p-2 border border-gray-300 rounded text-sm"
                                            >
                                              <option value="a">A</option>
                                              <option value="b">B</option>
                                              <option value="c">C</option>
                                            </select>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            onSaveQuiz?.(session.quiz.id, editedQuizQuestions)
                                          }
                                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                                        >
                                          <Save className="w-4 h-4" />
                                          Spara
                                        </button>
                                        <button
                                          onClick={onCancelEditing}
                                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1 text-sm"
                                        >
                                          <X className="w-4 h-4" />
                                          Avbryt
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    session.quiz.questions &&
                                    session.quiz.questions.length > 0 && (
                                      <div className="space-y-3">
                                        {session.quiz.questions.map((q: any, idx: number) => (
                                          <div key={q.id} className="text-sm">
                                            <p className="font-medium text-[#1d1d1f] mb-1">
                                              {idx + 1}. {q.question}
                                            </p>
                                            <div className="text-xs text-[#86868b] space-y-1 ml-4">
                                              <p>a) {q.optionA}</p>
                                              <p>b) {q.optionB}</p>
                                              <p>c) {q.optionC}</p>
                                              <p className="text-green-600 mt-1">
                                                Rätt svar: {q.correctAnswer.toUpperCase()}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                              {!hasArticle && !hasVideo && !hasQuiz && (
                                <p className="text-sm text-[#86868b] italic">
                                  Inget innehåll genererat ännu för denna session.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
