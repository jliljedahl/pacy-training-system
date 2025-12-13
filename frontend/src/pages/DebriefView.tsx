import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workflowApi, projectsApi } from '../services/api';

interface Alternative {
  id: string;
  title: string;
  description: string;
  recommended: boolean;
}

interface DebriefSource {
  name: string;
  type: string;
  year: string;
  relevance: string;
}

interface DebriefData {
  researchSummary: string;
  sources: DebriefSource[] | string[];  // Support both old and new format
  alternatives: Alternative[];
  fullDebrief: string;
}

type DebriefPhase = 'loading' | 'generating' | 'review' | 'feedback' | 'regenerating' | 'approved';

export default function DebriefView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [phase, setPhase] = useState<DebriefPhase>('loading');
  const [progress, setProgress] = useState<string[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load project and check status
  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;

      try {
        const res = await projectsApi.getOne(projectId);
        setProject(res.data);

        // Check if debrief already exists
        if (res.data.status === 'debrief_review' || res.data.status === 'matrix_creation') {
          try {
            const debriefRes = await workflowApi.getDebrief(projectId);
            setDebrief(debriefRes.data);
            setPhase('review');
            // Pre-select recommended alternative
            const recommended = debriefRes.data.alternatives?.find((a: Alternative) => a.recommended);
            if (recommended) setSelectedAlternative(recommended.id);
          } catch {
            // No debrief yet, will need to generate
            setPhase('loading');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      }
    }

    loadProject();
  }, [projectId]);

  // Start debrief generation
  const handleStartDebrief = async () => {
    if (!projectId) return;

    setPhase('generating');
    setProgress([]);
    setError(null);

    try {
      const result = await workflowApi.startDebrief(projectId, (msg) => {
        setProgress((prev) => [...prev, msg]);
      });

      setDebrief(result as DebriefData);
      setPhase('review');

      // Pre-select recommended alternative
      const recommended = (result as DebriefData).alternatives?.find((a) => a.recommended);
      if (recommended) setSelectedAlternative(recommended.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate debrief');
      setPhase('loading');
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!projectId || !feedback.trim()) return;

    setPhase('feedback');
    setAiResponse('');

    try {
      const result = await workflowApi.submitDebriefFeedback(
        projectId,
        feedback,
        selectedAlternative,
        (msg) => setProgress((prev) => [...prev, msg])
      );

      setAiResponse(result?.message || 'Feedback mottagen.');
      setPhase('review');
    } catch (err: any) {
      setError(err.message);
      setPhase('review');
    }
  };

  // Regenerate debrief
  const handleRegenerate = async () => {
    if (!projectId) return;

    setPhase('regenerating');
    setProgress([]);
    setError(null);

    try {
      const result = await workflowApi.regenerateDebrief(
        projectId,
        feedback,
        selectedAlternative,
        (msg) => setProgress((prev) => [...prev, msg])
      );

      setDebrief(result as DebriefData);
      setFeedback('');
      setAiResponse('');
      setPhase('review');

      // Pre-select recommended alternative
      const recommended = (result as DebriefData).alternatives?.find((a) => a.recommended);
      if (recommended) setSelectedAlternative(recommended.id);
    } catch (err: any) {
      setError(err.message);
      setPhase('review');
    }
  };

  // Approve debrief
  const handleApprove = async () => {
    if (!projectId || !selectedAlternative) {
      setError('Välj ett alternativ innan du godkänner');
      return;
    }

    try {
      await workflowApi.approveDebrief(projectId, selectedAlternative);
      setPhase('approved');

      // Navigate to matrix creation
      setTimeout(() => {
        navigate(`/projects/${projectId}?createMatrix=true`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Render loading state
  if (phase === 'loading' && !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Tillbaka till projekt
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Debrief: {project?.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Granska research-resultat och välj inriktning för programmet
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            Stäng
          </button>
        </div>
      )}

      {/* Start button (before debrief exists) */}
      {phase === 'loading' && !debrief && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Starta Debrief</h2>
          <p className="text-gray-600 mb-6">
            Klicka för att starta research och generera debrief med tre alternativa inriktningar.
          </p>
          <button
            onClick={handleStartDebrief}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Starta Research & Debrief
          </button>
        </div>
      )}

      {/* Progress display */}
      {(phase === 'generating' || phase === 'regenerating') && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-4">
            {phase === 'generating' ? 'Genererar Debrief...' : 'Uppdaterar Debrief...'}
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progress.map((msg, i) => (
              <p key={i} className="text-gray-600 text-sm">{msg}</p>
            ))}
          </div>
          <div className="mt-4">
            <div className="animate-pulse bg-blue-100 h-2 rounded"></div>
          </div>
        </div>
      )}

      {/* Debrief review */}
      {(phase === 'review' || phase === 'feedback') && debrief && (
        <div className="space-y-6">
          {/* Research Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Research-sammanfattning</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{debrief.researchSummary}</p>

            {debrief.sources && debrief.sources.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Källor</h3>
                <div className="space-y-3">
                  {debrief.sources.map((source, i) => (
                    typeof source === 'string' ? (
                      // Old format: simple string
                      <div key={i} className="text-gray-600 text-sm pl-4 border-l-2 border-gray-200">
                        {source}
                      </div>
                    ) : (
                      // New format: structured source
                      <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{source.name}</p>
                            <p className="text-xs text-gray-500">{source.type} • {source.year}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 italic">"{source.relevance}"</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Debrief */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Komplett Debrief</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {debrief.fullDebrief}
            </div>
          </div>

          {/* Alternatives */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Välj Inriktning</h2>
            <p className="text-gray-600 mb-4">
              Välj en av de tre inriktningarna för ditt program:
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {debrief.alternatives?.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => setSelectedAlternative(alt.id)}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition
                    ${selectedAlternative === alt.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${alt.recommended ? 'ring-2 ring-green-200' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {alt.id}. {alt.title}
                    </h3>
                    {alt.recommended && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Rekommenderat
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{alt.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">{aiResponse}</p>
            </div>
          )}

          {/* Feedback section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Feedback</h2>
            <p className="text-gray-600 mb-4">
              Om inget alternativ passar, ge feedback så uppdaterar vi debriefen:
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Skriv din feedback här..."
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim() || phase === 'feedback'}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {phase === 'feedback' ? 'Skickar...' : 'Skicka Feedback'}
              </button>

              <button
                onClick={handleRegenerate}
                disabled={phase === 'feedback'}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 transition"
              >
                Generera Ny Debrief
              </button>
            </div>
          </div>

          {/* Approve button */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Godkänn och fortsätt</h2>
                <p className="text-gray-600">
                  När du är nöjd med debriefsen, godkänn för att skapa programmatrisen.
                </p>
              </div>
              <button
                onClick={handleApprove}
                disabled={!selectedAlternative}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Godkänn Debrief & Skapa Matris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approved state */}
      {phase === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Debrief Godkänd!
          </h2>
          <p className="text-green-700">
            Omdirigerar till matris-skapande...
          </p>
        </div>
      )}
    </div>
  );
}
