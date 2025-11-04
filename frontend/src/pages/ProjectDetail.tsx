import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCircle, Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { projectsApi, workflowApi, contentApi } from '../services/api';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'content'>('overview');

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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Status: {project.status}</span>
              <span>Language: {project.language}</span>
              <span>Deliverables: {project.deliverables}</span>
            </div>
          </div>
          <button
            onClick={exportProject}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'matrix'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Program Matrix
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'content'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Content
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 font-medium"
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
                  <div className="prose max-w-none">
                    <ReactMarkdown>
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
                    <h3 className="text-lg font-semibold mb-4">
                      Chapter {chapter.number}: {chapter.name}
                    </h3>

                    <div className="space-y-3">
                      {chapter.sessions.map((session: any) => (
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

                          {!session.article && project.programMatrix?.approved && (
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
                          )}

                          {session.article && (
                            <a
                              href={`#article-${session.article.id}`}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                            >
                              View Article
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No content created yet. Approve the program matrix first.
                </p>
              )}
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
