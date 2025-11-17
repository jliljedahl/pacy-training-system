import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCircle, Download, FileText, Edit2, Save, X, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { projectsApi, workflowApi, contentApi } from '../services/api';
import TableOfContents from '../components/TableOfContents';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'content' | 'toc'>('overview');
  const [editingContent, setEditingContent] = useState<{ type: string; id: string } | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [lastCompletedChapter, setLastCompletedChapter] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [editedQuizQuestions, setEditedQuizQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsApi.getOne(id!);
      console.log('🔍 Loaded project data:', response.data);
      console.log('🔍 Program Matrix exists:', !!response.data.programMatrix);
      console.log('🔍 Workflow Steps:', response.data.workflowSteps);
      
      // Log chapters and sessions for debugging
      if (response.data.chapters) {
        console.log(`🔍 Found ${response.data.chapters.length} chapters`);
        response.data.chapters.forEach((chapter: any) => {
          console.log(`  Chapter ${chapter.number}: ${chapter.name} - ${chapter.sessions?.length || 0} sessions`);
          chapter.sessions?.forEach((session: any) => {
            console.log(`    Session ${session.number}: ${session.name} - Article: ${session.article ? 'YES' : 'NO'}`);
          });
        });
      }
      
      const matrixStep = response.data.workflowSteps?.find((s: any) => s.step === 'create_program_matrix' || s.step === 'create_program_design');
      console.log('🔍 Matrix step found:', !!matrixStep);
      if (matrixStep) {
        console.log('🔍 Matrix step result length:', matrixStep.result?.length || 0);
        console.log('🔍 Matrix step result preview:', matrixStep.result?.substring(0, 200));
      }
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const startProgramDesign = async () => {
    setExecuting(true);
    setProgress([]);

    try {
      await workflowApi.executeProgramDesign(id!, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      // Reload project to get new data
      await loadProject();
      setActiveTab('matrix');

      // Force another reload after a short delay to ensure data is fully saved
      setTimeout(async () => {
        await loadProject();
      }, 1000);
    } catch (error: any) {
      console.error('Program design failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setExecuting(false);
    }
  };

  const approveMatrix = async () => {
    try {
      await workflowApi.approveMatrix(id!);
      await loadProject();
    } catch (error) {
      console.error('Failed to approve matrix:', error);
    }
  };

  const createArticle = async (sessionId: string, isFirst: boolean) => {
    setExecuting(true);
    setProgress([]);

    try {
      await workflowApi.createArticle(sessionId, isFirst, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      await loadProject();
      setActiveTab('content');
    } catch (error: any) {
      console.error('Article creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setExecuting(false);
    }
  };

  const approveArticle = async (articleId: string) => {
    try {
      await workflowApi.approveArticle(articleId);
      await loadProject();
      
      // After approving first article, check if we should auto-generate all remaining articles
      const firstArticle = project?.chapters
        ?.flatMap((c: any) => c.sessions)
        ?.find((s: any) => s.article?.id === articleId);
      
      if (firstArticle) {
        const allSessions = project?.chapters?.flatMap((c: any) => c.sessions) || [];
        const sessionsWithoutArticles = allSessions.filter((s: any) => !s.article);
        
        if (sessionsWithoutArticles.length > 0) {
          const shouldBatch = confirm(
            `Du har godkänt första artikeln. Vill du generera alla ${sessionsWithoutArticles.length} återstående artiklar automatiskt?`
          );
          
          if (shouldBatch) {
            await batchCreateAllArticles();
          }
        }
      }
    } catch (error) {
      console.error('Failed to approve article:', error);
      alert('Failed to approve article');
    }
  };

  const batchCreateAllArticles = async () => {
    if (!id) return;
    
    setExecuting(true);
    setProgress([]);
    setProgress((prev) => [...prev, '🚀 Starting batch generation for ALL articles...']);

    try {
      const result = await workflowApi.batchCreateAllArticles(id, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      console.log('Batch generation result:', result);
      setProgress((prev) => [...prev, `✅ Batch generation complete! Created ${result.created || 0} articles.`]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProject();
      
      setTimeout(async () => {
        await loadProject();
        setProgress((prev) => [...prev, '🔄 Refreshed project data']);
      }, 2000);
      
      setActiveTab('content');
    } catch (error: any) {
      console.error('Batch article creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
      alert(`Batch generation failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const createVideo = async (sessionId: string) => {
    setExecuting(true);
    setProgress([]);

    try {
      await workflowApi.createVideo(sessionId, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      await loadProject();
      setActiveTab('content');
    } catch (error: any) {
      console.error('Video creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setExecuting(false);
    }
  };

  const approveVideo = async (videoId: string) => {
    try {
      await workflowApi.approveVideo(videoId);
      await loadProject();
      
      // After approving first video, offer to batch generate rest
      const allSessions = project?.chapters?.flatMap((c: any) => c.sessions) || [];
      const sessionsWithArticlesButNoVideo = allSessions.filter(
        (s: any) => s.article && !s.videoScript
      );
      
      if (sessionsWithArticlesButNoVideo.length > 0) {
        const shouldBatch = confirm(
          `Du har godkänt första video-narrativet. Vill du generera alla ${sessionsWithArticlesButNoVideo.length} återstående video-narrativ automatiskt?`
        );
        
        if (shouldBatch) {
          await batchCreateAllVideos();
        }
      }
    } catch (error) {
      console.error('Failed to approve video:', error);
      alert('Failed to approve video');
    }
  };

  const batchCreateAllVideos = async () => {
    if (!id) return;
    
    setExecuting(true);
    setProgress([]);
    setProgress((prev) => [...prev, '🎬 Starting batch generation for ALL video scripts...']);

    try {
      const result = await workflowApi.batchCreateVideos(id, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      setProgress((prev) => [...prev, `✅ Batch video generation complete! Created ${result.created || 0} video scripts.`]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProject();
      
      setTimeout(async () => {
        await loadProject();
      }, 2000);
      
      setActiveTab('content');
    } catch (error: any) {
      console.error('Batch video creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
      alert(`Batch video generation failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const createQuiz = async (sessionId: string) => {
    setExecuting(true);
    setProgress([]);

    try {
      await workflowApi.createQuiz(sessionId, project?.quizQuestions, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      await loadProject();
      setActiveTab('content');
    } catch (error: any) {
      console.error('Quiz creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setExecuting(false);
    }
  };

  const approveQuiz = async (quizId: string) => {
    try {
      await workflowApi.approveQuiz(quizId);
      await loadProject();
      
      // After approving first quiz, offer to batch generate rest
      const allSessions = project?.chapters?.flatMap((c: any) => c.sessions) || [];
      const sessionsWithArticlesButNoQuiz = allSessions.filter(
        (s: any) => s.article && !s.quiz
      );
      
      if (sessionsWithArticlesButNoQuiz.length > 0) {
        const shouldBatch = confirm(
          `Du har godkänt första quizet. Vill du generera alla ${sessionsWithArticlesButNoQuiz.length} återstående quiz automatiskt?`
        );
        
        if (shouldBatch) {
          await batchCreateAllQuizzes();
        }
      }
    } catch (error) {
      console.error('Failed to approve quiz:', error);
      alert('Failed to approve quiz');
    }
  };

  const batchCreateAllQuizzes = async () => {
    if (!id) return;
    
    setExecuting(true);
    setProgress([]);
    setProgress((prev) => [...prev, '🎯 Starting batch generation for ALL quizzes...']);

    try {
      const result = await workflowApi.batchCreateQuizzes(id, project?.quizQuestions, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      setProgress((prev) => [...prev, `✅ Batch quiz generation complete! Created ${result.created || 0} quizzes.`]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProject();
      
      setTimeout(async () => {
        await loadProject();
      }, 2000);
      
      setActiveTab('content');
    } catch (error: any) {
      console.error('Batch quiz creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
      alert(`Batch quiz generation failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const createTestSession = async (sessionId: string) => {
    setExecuting(true);
    setProgress([]);
    setProgress((prev) => [...prev, '🧪 Starting test session (article + video + quiz)...']);

    try {
      const result = await workflowApi.createTestSession(sessionId, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      setProgress((prev) => [...prev, '✅ Test session complete!']);
      
      await loadProject();
      setActiveTab('content');
    } catch (error: any) {
      console.error('Test session creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
      alert(`Test session failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const saveFeedbackForContent = async (type: 'article' | 'video' | 'quiz', id: string, feedbackText: string) => {
    try {
      await workflowApi.saveFeedback(type, id, feedbackText);
      setFeedback((prev) => ({ ...prev, [`${type}-${id}`]: feedbackText }));
      await loadProject();
      alert('Feedback sparad! Denna feedback kommer att användas när du genererar resten av kapitlet.');
    } catch (error: any) {
      console.error('Failed to save feedback:', error);
      alert(`Kunde inte spara feedback: ${error.message}`);
    }
  };

  const startEditing = (type: 'article' | 'video', id: string, currentContent: string) => {
    setEditingContent({ type, id });
    setEditedContent(currentContent);
  };

  const cancelEditing = () => {
    setEditingContent(null);
    setEditedContent('');
    setEditingQuiz(null);
    setEditedQuizQuestions([]);
  };

  const startEditingQuiz = (quizId: string, questions: any[]) => {
    setEditingQuiz(quizId);
    setEditedQuizQuestions([...questions]);
  };

  const saveContent = async (type: 'article' | 'video', id: string) => {
    try {
      const wordCount = editedContent.split(/\s+/).filter((w) => w.length > 0).length;
      await workflowApi.updateContent(type, id, editedContent, wordCount);
      setEditingContent(null);
      setEditedContent('');
      await loadProject();
      alert('Innehåll sparad!');
    } catch (error: any) {
      console.error('Failed to save content:', error);
      alert(`Kunde inte spara innehåll: ${error.message}`);
    }
  };

  const saveQuizQuestions = async (quizId: string, questions: any[]) => {
    try {
      await workflowApi.updateQuizQuestions(quizId, questions);
      setEditingQuiz(null);
      setEditedQuizQuestions([]);
      await loadProject();
      alert('Quiz-frågor sparade!');
    } catch (error: any) {
      console.error('Failed to save quiz questions:', error);
      alert(`Kunde inte spara quiz-frågor: ${error.message}`);
    }
  };

  // Find next chapter that needs generation
  const findNextChapter = () => {
    if (!project?.chapters) return null;
    
    const sortedChapters = [...project.chapters].sort((a: any, b: any) => a.number - b.number);
    
    for (const chapter of sortedChapters) {
      const sessions = chapter.sessions || [];
      const hasIncompleteContent = sessions.some((session: any) => {
        // Check if session is missing any content
        return !session.article || !session.videoScript || !session.quiz;
      });
      
      if (hasIncompleteContent) {
        return chapter;
      }
    }
    
    return null; // All chapters are complete
  };

  const batchCreateChapterComplete = async (chapterId: string) => {
    setExecuting(true);
    setProgress([]);
    setProgress((prev) => [...prev, '🚀 Starting complete chapter batch generation (article + video + quiz)...']);

    try {
      const result = await workflowApi.batchCreateChapterComplete(chapterId, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      setProgress((prev) => [...prev, '✅ Chapter batch generation complete!']);
      setLastCompletedChapter(chapterId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProject();
      
      setTimeout(async () => {
        await loadProject();
      }, 2000);
      
      // Show option to continue with next chapter or edit
      const nextChapter = findNextChapter();
      if (nextChapter) {
        setProgress((prev) => [...prev, `📚 Nästa kapitel att generera: Kapitel ${nextChapter.number} - ${nextChapter.name}`]);
        setProgress((prev) => [...prev, `💡 Du kan nu antingen redigera innehåll via innehållsförteckningen eller fortsätta med nästa kapitel.`]);
      } else {
        setProgress((prev) => [...prev, `🎉 Alla kapitel är nu genererade!`]);
      }
      
      setActiveTab('toc'); // Switch to table of contents for review/editing
    } catch (error: any) {
      console.error('Chapter batch creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
      alert(`Chapter batch generation failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const batchCreateArticles = async (chapterId: string) => {
    setExecuting(true);
    setProgress([]);
    setProgress((prev) => [...prev, '🚀 Starting batch article generation...']);

    try {
      const result = await workflowApi.batchCreateArticles(chapterId, (message) => {
        setProgress((prev) => [...prev, message]);
      });

      console.log('Batch generation result:', result);
      setProgress((prev) => [...prev, `✅ Batch generation complete! Created ${result.created || 0} articles.`]);
      
      // Wait a moment for database to be fully updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload project data to show new articles
      await loadProject();
      
      // Force another reload after a short delay to ensure all articles are visible
      setTimeout(async () => {
        await loadProject();
        setProgress((prev) => [...prev, '🔄 Refreshed project data']);
      }, 2000);
      
      setActiveTab('content');
    } catch (error: any) {
      console.error('Batch article creation failed:', error);
      setProgress((prev) => [...prev, `❌ Error: ${error.message}`]);
      alert(`Batch generation failed: ${error.message}\n\nCheck the progress log below for details.`);
    } finally {
      setExecuting(false);
    }
  };

  const exportProject = async () => {
    try {
      const response = await contentApi.exportProject(id!);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.md`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const printMatrix = () => {
    const matrixContent = project.workflowSteps
      ?.find((s: any) => s.step === 'create_program_matrix' || s.step === 'create_program_design')
      ?.result || '';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${project.name} - Program Matrix</title>
            <style>
              @media print {
                @page { margin: 2cm; }
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
              }
              h1 {
                color: #111827;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 0.5rem;
                margin-bottom: 2rem;
              }
              h2 {
                color: #374151;
                margin-top: 2rem;
                margin-bottom: 1rem;
              }
              h3 {
                color: #4b5563;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 2rem 0;
                font-size: 0.9rem;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              thead {
                background-color: #f3f4f6;
                border-bottom: 2px solid #e5e7eb;
              }
              th {
                padding: 1rem;
                text-align: left;
                font-weight: 600;
                color: #1f2937;
                border: 1px solid #e5e7eb;
              }
              td {
                padding: 1rem;
                border: 1px solid #e5e7eb;
                vertical-align: top;
              }
              tbody tr:nth-child(even) {
                background-color: #f9fafb;
              }
              ul, ol {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
              }
              li {
                margin: 0.25rem 0;
              }
              p {
                margin: 0.5rem 0;
              }
              .project-info {
                background-color: #eff6ff;
                border-left: 4px solid #2563eb;
                padding: 1rem;
                margin-bottom: 2rem;
              }
              .print-date {
                text-align: right;
                color: #6b7280;
                font-size: 0.875rem;
                margin-top: 2rem;
              }
            </style>
          </head>
          <body>
            <div class="project-info">
              <strong>Project:</strong> ${project.name}<br>
              <strong>Language:</strong> ${project.language}<br>
              <strong>Deliverables:</strong> ${project.deliverables}
            </div>
            <div id="content"></div>
            <div class="print-date">
              Exported: ${new Date().toLocaleString('sv-SE')}
            </div>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script>
              const content = ${JSON.stringify(matrixContent)};
              document.getElementById('content').innerHTML = marked.parse(content);
              setTimeout(() => window.print(), 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const downloadMatrix = () => {
    const matrixContent = project.workflowSteps
      ?.find((s: any) => s.step === 'create_program_matrix' || s.step === 'create_program_design')
      ?.result || '';

    const blob = new Blob([matrixContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name} - Program Matrix.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header - Premium Design */}
      <div className="bg-white rounded-2xl subtle-shadow border border-gray-100/50 p-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-6 text-sm text-[#86868b]">
              <span className="font-medium text-[#1d1d1f]">Status:</span> <span>{project.status}</span>
              <span className="font-medium text-[#1d1d1f]">Language:</span> <span>{project.language}</span>
              <span className="font-medium text-[#1d1d1f]">Deliverables:</span> <span>{project.deliverables.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button
            onClick={exportProject}
            className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-[#f5f5f7] transition-colors flex items-center gap-2 text-sm font-medium text-[#1d1d1f]"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs - Premium Design */}
      <div className="bg-white rounded-2xl subtle-shadow border border-gray-100/50 mb-8">
        <div className="border-b border-gray-100">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'matrix'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Program Matrix
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('toc')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'toc'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Innehållsförteckning
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.learningObjectives || 'Not specified'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Target Audience</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.targetAudience || 'Not specified'}
                </p>
              </div>

              {project.particularAngle && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Particular Angle/Framework</h3>
                  <p className="text-gray-700">{project.particularAngle}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">Source Materials</h3>
                {project.sourceMaterials?.length > 0 ? (
                  <ul className="space-y-2">
                    {project.sourceMaterials.map((material: any) => (
                      <li key={material.id} className="flex items-center gap-2 text-gray-700">
                        <FileText className="w-4 h-4" />
                        {material.filename}
                        <span className="text-xs text-gray-500">({material.type})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No source materials uploaded</p>
                )}
              </div>

              {/* Start Program Design */}
              {project.status === 'information_gathering' && !project.programMatrix && (
                <div className="pt-6 border-t">
                  <button
                    onClick={startProgramDesign}
                    disabled={executing}
                    className="premium-button text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    {executing ? 'Creating Program Matrix...' : 'Start Program Design'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Matrix Tab */}
          {activeTab === 'matrix' && (
            <div>
              {project.programMatrix ? (
                <div className="space-y-6">
                  {/* Export buttons */}
                  <div className="flex gap-3 justify-end border-b pb-4">
                    <button
                      onClick={printMatrix}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                      title="Print or save as PDF"
                    >
                      <Download className="w-4 h-4" />
                      Print/PDF
                    </button>
                    <button
                      onClick={downloadMatrix}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                      title="Download as markdown file"
                    >
                      <FileText className="w-4 h-4" />
                      Download Matrix
                    </button>
                  </div>

                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {project.workflowSteps
                        ?.find((s: any) => s.step === 'create_program_matrix' || s.step === 'create_program_design')
                        ?.result || 'Loading...'}
                    </ReactMarkdown>
                  </div>

                  {!project.programMatrix.approved && (
                    <div className="flex gap-4">
                      <button
                        onClick={approveMatrix}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve Program Matrix
                      </button>
                    </div>
                  )}

                  {project.programMatrix.approved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-green-800 font-medium">
                          ✓ Program matrix approved! Ready to create articles.
                        </p>
                        {project.chapters && project.chapters.length > 0 && (
                          <button
                            onClick={() => setActiveTab('content')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Go to Content Tab →
                          </button>
                        )}
                      </div>
                      {(!project.chapters || project.chapters.length === 0) && (
                        <p className="text-orange-600 text-sm mt-2">
                          ⚠️ No chapters/sessions found. The matrix may need to be regenerated with the new format.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Program matrix not created yet</p>
              )}
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {project.chapters && project.chapters.length > 0 ? (
                project.chapters.map((chapter: any) => (
                  <div key={chapter.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">
                      Chapter {chapter.number}: {chapter.name}
                    </h3>
                      <div className="flex gap-2">
                        {/* Test session button - only for first session in first chapter */}
                        {chapter.number === 1 && 
                         chapter.sessions[0] && 
                         !chapter.sessions[0].article && 
                         (project.programMatrix?.approved || project.programMatrix) && (
                          <button
                            onClick={() => createTestSession(chapter.sessions[0].id)}
                            disabled={executing}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm font-medium"
                            title="Create test session: article + video + quiz"
                          >
                            🧪 Create Test Session
                          </button>
                        )}
                        
                        {/* Batch generate articles button */}
                        {chapter.sessions.some((s: any) => s.article) && 
                         chapter.sessions.some((s: any) => !s.article) && (
                          <button
                            onClick={() => batchCreateArticles(chapter.id)}
                            disabled={executing}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                          >
                            {executing ? 'Generating...' : 'Generate All Remaining Articles'}
                          </button>
                        )}
                        
                        {/* Batch generate complete chapter (article + video + quiz) */}
                        {chapter.sessions.some((s: any) => s.article?.approved && s.videoScript?.approved && s.quiz?.approved) && (
                          <button
                            onClick={() => batchCreateChapterComplete(chapter.id)}
                            disabled={executing}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-medium"
                            title="Generate article + video + quiz for all sessions in this chapter"
                          >
                            {executing ? 'Generating...' : 'Generate Complete Chapter'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {chapter.sessions
                        .sort((a: any, b: any) => a.number - b.number)
                        .map((session: any) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">
                              Session {session.number}: {session.name}
                            </p>
                            {session.article && (
                              <p className="text-sm text-green-600">
                                ✓ Article created ({session.article.wordCount} words)
                              </p>
                            )}
                          </div>

                          {!session.article && (project.programMatrix?.approved || project.programMatrix) && (
                            <div className="flex gap-2">
                            <button
                              onClick={() =>
                                createArticle(
                                  session.id,
                                  !project.chapters.some((c: any) =>
                                    c.sessions.some((s: any) => s.article)
                                  )
                                )
                              }
                              disabled={executing}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                            >
                              Create Article
                              </button>
                              {/* Test session button - only for first session */}
                              {session.number === 1.1 && (
                                <button
                                  onClick={() => createTestSession(session.id)}
                                  disabled={executing}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm"
                                  title="Create test session: article + video + quiz"
                                >
                                  🧪 Test Session
                            </button>
                              )}
                            </div>
                          )}

                          {session.article && (
                            <button
                              onClick={() => {
                                const element = document.getElementById(`article-${session.article.id}`);
                                element?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                            >
                              View Article
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Display articles for this chapter */}
                    {chapter.sessions.some((s: any) => s.article) && (
                      <div className="mt-6 space-y-6">
                        <div className="flex justify-between items-center border-t pt-4">
                          <h4 className="font-semibold text-gray-700">Articles</h4>
                          <button
                            onClick={loadProject}
                            className="px-3 py-1 text-sm text-[#007AFF] hover:text-[#0051D5] font-medium"
                          >
                            🔄 Refresh
                          </button>
                        </div>
                        {chapter.sessions
                          .filter((s: any) => s.article)
                          .map((session: any) => (
                            <div
                              key={session.article.id}
                              id={`article-${session.article.id}`}
                              className="border-l-4 border-blue-500 pl-4 py-2"
                            >
                              <h5 className="font-semibold text-lg mb-2">
                                Session {session.number}: {session.name}
                              </h5>
                              <div className="flex items-center gap-4 mb-3 flex-wrap">
                                <p className="text-sm text-gray-600">
                                {session.article.wordCount} words • Status: {session.article.status}
                              </p>
                                {!session.article.approved && (
                                  <button
                                    onClick={() => approveArticle(session.article.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                  >
                                    Approve Article
                                  </button>
                                )}
                                {session.article.approved && (
                                  <>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                                      ✓ Approved
                                    </span>
                                    {!session.videoScript && (
                                      <button
                                        onClick={() => createVideo(session.id)}
                                        disabled={executing}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
                                      >
                                        Create Video Script
                                      </button>
                                    )}
                                    {session.videoScript && !session.videoScript.approved && (
                                      <button
                                        onClick={() => approveVideo(session.videoScript.id)}
                                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                      >
                                        Approve Video
                                      </button>
                                    )}
                                    {session.videoScript?.approved && !session.quiz && (
                                      <button
                                        onClick={() => createQuiz(session.id)}
                                        disabled={executing}
                                        className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm font-medium"
                                      >
                                        Create Quiz
                                      </button>
                                    )}
                                    {session.quiz && !session.quiz.approved && (
                                      <button
                                        onClick={() => approveQuiz(session.quiz.id)}
                                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                      >
                                        Approve Quiz
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                              {/* Edit mode or view mode */}
                              {editingContent?.type === 'article' && editingContent.id === session.article.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-sm"
                                    placeholder="Edit article content..."
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => saveContent('article', session.article.id)}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                      <Save className="w-4 h-4" />
                                      Save Changes
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-end gap-2 mb-2">
                                    <button
                                      onClick={() => startEditing('article', session.article.id, session.article.content)}
                                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      Edit
                                    </button>
                                  </div>
                              <div className="prose max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.article.content}</ReactMarkdown>
                              </div>
                                </>
                              )}
                              
                              {/* Feedback section */}
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="w-4 h-4 text-gray-600" />
                                  <h6 className="font-semibold text-sm text-gray-700">Feedback/Kommentarer</h6>
                                </div>
                                <textarea
                                  value={feedback[`article-${session.article.id}`] || session.article.feedback || ''}
                                  onChange={(e) => setFeedback((prev) => ({ ...prev, [`article-${session.article.id}`]: e.target.value }))}
                                  placeholder="Lägg till feedback för att justera innehållet. Denna feedback kommer att användas när du genererar resten av kapitlet."
                                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                  onClick={() => saveFeedbackForContent('article', session.article.id, feedback[`article-${session.article.id}`] || '')}
                                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                  Save Feedback
                                </button>
                              </div>
                              
                              {session.article.factCheck && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="text-sm font-semibold text-yellow-800">Fact Check Notes:</p>
                                  <p className="text-sm text-yellow-700">{session.article.factCheck}</p>
                                </div>
                              )}

                              {/* Video Script Section */}
                              {session.videoScript && (
                                <div className="mt-6 border-l-4 border-blue-500 pl-4 py-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-semibold text-lg flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-blue-600" />
                                      Video Script
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">
                                        {session.videoScript.wordCount} words
                                        {session.videoScript.approved && (
                                          <span className="ml-2 text-green-600">✓ Approved</span>
                                        )}
                                      </span>
                                      {!session.videoScript.approved && (
                                        <button
                                          onClick={() => approveVideo(session.videoScript.id)}
                                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                          Approve Video
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {editingContent?.type === 'video' && editingContent.id === session.videoScript.id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg font-mono text-sm"
                                        placeholder="Edit video script content..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => saveContent('video', session.videoScript.id)}
                                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                          <Save className="w-4 h-4" />
                                          Save Changes
                                        </button>
                                        <button
                                          onClick={cancelEditing}
                                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <X className="w-4 h-4" />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex justify-end gap-2 mb-2">
                                        <button
                                          onClick={() => startEditing('video', session.videoScript.id, session.videoScript.content)}
                                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                          Edit
                                        </button>
                                      </div>
                                      <div className="prose max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.videoScript.content}</ReactMarkdown>
                                      </div>
                                    </>
                                  )}

                                  {/* Video Feedback */}
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-gray-600" />
                                      <h6 className="font-semibold text-sm text-gray-700">Feedback/Kommentarer</h6>
                                    </div>
                                    <textarea
                                      value={feedback[`video-${session.videoScript.id}`] || session.videoScript.feedback || ''}
                                      onChange={(e) => setFeedback((prev) => ({ ...prev, [`video-${session.videoScript.id}`]: e.target.value }))}
                                      placeholder="Lägg till feedback för video-narrativet..."
                                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <button
                                      onClick={() => saveFeedbackForContent('video', session.videoScript.id, feedback[`video-${session.videoScript.id}`] || '')}
                                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                      Save Feedback
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Quiz Section */}
                              {session.quiz && (
                                <div className="mt-6 border-l-4 border-purple-500 pl-4 py-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-semibold text-lg flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-purple-600" />
                                      Quiz
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">
                                        {session.quiz.questions?.length || 0} frågor
                                        {session.quiz.approved && (
                                          <span className="ml-2 text-green-600">✓ Approved</span>
                                        )}
                                      </span>
                                      {!session.quiz.approved && (
                                        <button
                                          onClick={() => approveQuiz(session.quiz.id)}
                                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                          Approve Quiz
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {session.quiz.questions && session.quiz.questions.length > 0 && (
                                    <div className="space-y-4">
                                      {session.quiz.questions.map((q: any, idx: number) => (
                                        <div key={q.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                          <p className="font-medium mb-2">
                                            {idx + 1}. {q.question}
                                          </p>
                                          <div className="space-y-1 text-sm ml-4">
                                            <p>a) {q.optionA}</p>
                                            <p>b) {q.optionB}</p>
                                            <p>c) {q.optionC}</p>
                                            <p className="text-green-600 mt-2 font-medium">
                                              Rätt svar: {q.correctAnswer.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Quiz Feedback */}
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-gray-600" />
                                      <h6 className="font-semibold text-sm text-gray-700">Feedback/Kommentarer</h6>
                                    </div>
                                    <textarea
                                      value={feedback[`quiz-${session.quiz.id}`] || session.quiz.feedback || ''}
                                      onChange={(e) => setFeedback((prev) => ({ ...prev, [`quiz-${session.quiz.id}`]: e.target.value }))}
                                      placeholder="Lägg till feedback för quizet..."
                                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <button
                                      onClick={() => saveFeedbackForContent('quiz', session.quiz.id, feedback[`quiz-${session.quiz.id}`] || '')}
                                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                      Save Feedback
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No content created yet. Approve the program matrix first.
                </p>
              )}
            </div>
          )}

          {/* Table of Contents Tab */}
          {activeTab === 'toc' && project && (
            <div className="space-y-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-semibold text-[#1d1d1f]">
                    Innehållsförteckning
                  </h2>
                  {findNextChapter() && (
                    <button
                      onClick={() => {
                        const nextChapter = findNextChapter();
                        if (nextChapter) {
                          batchCreateChapterComplete(nextChapter.id);
                        }
                      }}
                      disabled={executing}
                      className="px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ➡️ Generera nästa kapitel ({findNextChapter()?.number})
                    </button>
                  )}
                </div>
                <p className="text-[#86868b]">
                  Översikt över alla kapitel, sessioner och innehåll. Klicka för att expandera och redigera.
                </p>
                {findNextChapter() && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Nästa kapitel att generera:</strong> Kapitel {findNextChapter()?.number} - {findNextChapter()?.name}
                    </p>
                  </div>
                )}
              </div>
              <TableOfContents 
                project={project} 
                onEditContent={startEditing}
                onSaveContent={saveContent}
                onEditQuiz={startEditingQuiz}
                onSaveQuiz={saveQuizQuestions}
                onCancelEditing={cancelEditing}
                editingContent={editingContent}
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                editingQuiz={editingQuiz}
                editedQuizQuestions={editedQuizQuestions}
                setEditedQuizQuestions={setEditedQuizQuestions}
              />
            </div>
          )}
        </div>
      </div>

      {/* Progress Log */}
      {progress.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
          <h3 className="text-white font-bold mb-2">Progress Log</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {progress.map((msg, idx) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
