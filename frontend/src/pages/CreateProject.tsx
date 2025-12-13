import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Building2, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { projectsApi, BriefExtractionResult } from '../services/api';

interface CompanyContext {
  company: {
    name: string;
    industry: string;
    description: string;
  };
  brandVoice: {
    tone: string;
    keyThemes: string[];
  };
  audience: {
    type: string;
  };
}

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [extractedData] = useState<BriefExtractionResult | null>(null);
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [briefSource, setBriefSource] = useState<'interview' | 'upload' | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    language: 'swedish',
    learningObjectives: '',
    targetAudience: '',
    desiredOutcomes: '',
    constraints: '',
    particularAngle: '',
    deliverables: 'articles',
    strictFidelity: false,
    quizQuestions: 3,
  });

  // Check for interview brief data and company context on mount
  useEffect(() => {
    // Get company context
    const companyContextStr = sessionStorage.getItem('companyContext');
    if (companyContextStr) {
      try {
        setCompanyContext(JSON.parse(companyContextStr));
      } catch (e) {
        console.error('Failed to parse company context:', e);
      }
    }

    // Get interview brief
    const interviewBriefStr = sessionStorage.getItem('interviewBrief');
    if (interviewBriefStr) {
      try {
        const interviewData = JSON.parse(interviewBriefStr);
        const brief = interviewData.brief;

        setFormData({
          name: brief.projectName || '',
          language: brief.language || 'swedish',
          learningObjectives: brief.learningObjectives || '',
          targetAudience: brief.targetAudience || '',
          desiredOutcomes: brief.desiredOutcomes || '',
          constraints: brief.constraints || '',
          particularAngle: brief.particularAngle || '',
          deliverables: brief.deliverables || 'articles',
          strictFidelity: brief.strictFidelity || false,
          quizQuestions: 3,
        });

        setBriefSource(interviewData.source || 'interview');
        // Clear the session storage
        sessionStorage.removeItem('interviewBrief');
      } catch (e) {
        console.error('Failed to parse interview brief:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Include company context in project data
      const projectData = {
        ...formData,
        companyContext: companyContext
          ? {
              name: companyContext.company.name,
              industry: companyContext.company.industry,
              description: companyContext.company.description,
              tone: companyContext.brandVoice.tone,
              audienceType: companyContext.audience.type,
            }
          : undefined,
      };

      const response = await projectsApi.create(projectData);
      const projectId = response.data.id;

      // Upload files if any
      for (const file of files) {
        await projectsApi.uploadSource(
          projectId,
          file,
          formData.strictFidelity ? 'strict_fidelity' : 'context'
        );
      }

      // Clear company context after project creation
      sessionStorage.removeItem('companyContext');

      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to create project. Make sure the backend server is running.';
      alert(`Kunde inte skapa projekt:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till start
        </button>
        <h1 className="text-3xl font-semibold text-[#1d1d1f] mb-2">Granska och skapa projekt</h1>
        <p className="text-[#86868b]">Kontrollera informationen nedan och justera vid behov.</p>
      </div>

      {/* Brief Summary Card */}
      {(briefSource || companyContext) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
          {/* Company Context Section */}
          {companyContext && (
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Building2 className="w-6 h-6 text-[#007AFF]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1d1d1f] mb-1">
                    {companyContext.company.name}
                  </h3>
                  <p className="text-sm text-[#86868b] mb-3">{companyContext.company.industry}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white rounded-lg text-xs text-[#1d1d1f]">
                      {companyContext.brandVoice.tone}
                    </span>
                    <span className="px-2 py-1 bg-white rounded-lg text-xs text-[#1d1d1f]">
                      {companyContext.audience.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Brief Source Badge */}
          {briefSource && (
            <div className="px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                {briefSource === 'interview' ? (
                  <Sparkles className="w-4 h-4 text-green-600" />
                ) : (
                  <FileText className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">
                  {briefSource === 'interview'
                    ? 'Brief skapad via intervju'
                    : 'Brief extraherad från dokument'}
                </p>
                <p className="text-xs text-[#86868b]">
                  Granska informationen och justera vid behov
                </p>
              </div>
              <Check className="w-5 h-5 text-green-500 ml-auto" />
            </div>
          )}
        </div>
      )}

      {/* Extraction Notes */}
      {extractedData && extractedData.needsHumanInput.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Följande fält behöver granskas:
          </p>
          <ul className="text-sm text-yellow-700 space-y-1">
            {extractedData.needsHumanInput.map((field, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
      >
        <div className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Projektnamn *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa] text-[#1d1d1f] transition-all"
              placeholder="t.ex. Grunderna i varumärkesbyggande"
            />
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Språk</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa]"
              >
                <option value="swedish">Svenska</option>
                <option value="english">Engelska</option>
              </select>
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Leverabler</label>
              <select
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa]"
              >
                <option value="articles">Endast artiklar</option>
                <option value="articles_videos">Artiklar + Videomanus</option>
                <option value="articles_videos_quizzes">Artiklar + Video + Quiz</option>
                <option value="full_program">Komplett program</option>
              </select>
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Lärandemål</label>
            <textarea
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa] resize-none"
              placeholder="Vad ska deltagarna kunna göra efter utbildningen?"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Målgrupp</label>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa] resize-none"
              placeholder="Vem är utbildningen för? Roller, erfarenhetsnivå..."
            />
          </div>

          {/* Desired Outcomes */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Önskade resultat
            </label>
            <textarea
              value={formData.desiredOutcomes}
              onChange={(e) => setFormData({ ...formData, desiredOutcomes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa] resize-none"
              placeholder="Vilka beteendeförändringar vill ni se?"
            />
          </div>

          {/* Particular Angle */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Specifikt ramverk eller perspektiv
            </label>
            <input
              type="text"
              value={formData.particularAngle}
              onChange={(e) => setFormData({ ...formData, particularAngle: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa]"
              placeholder="t.ex. Ehrenberg-Bass, Design Thinking"
            />
          </div>

          {/* Strict Fidelity Toggle */}
          <div className="flex items-center gap-3 p-4 bg-[#f5f5f7] rounded-xl">
            <input
              type="checkbox"
              id="strictFidelity"
              checked={formData.strictFidelity}
              onChange={(e) => setFormData({ ...formData, strictFidelity: e.target.checked })}
              className="w-5 h-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]"
            />
            <label htmlFor="strictFidelity" className="text-sm text-[#1d1d1f]">
              <span className="font-medium">Strikt källtrohet</span>
              <span className="text-[#86868b] block text-xs">
                Innehållet måste exakt följa de uppladdade källorna
              </span>
            </label>
          </div>

          {/* Source Materials Upload */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Källmaterial (valfritt)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-[#007AFF]/30 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-[#86868b]" />
                </div>
                <span className="text-sm text-[#1d1d1f] font-medium">Klicka för att ladda upp</span>
                <span className="text-xs text-[#86868b]">PDF, DOCX, TXT</span>
              </label>
              {files.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-[#86868b] mb-2">Valda filer:</p>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[#1d1d1f]">
                        <FileText className="w-4 h-4 text-[#007AFF]" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="px-5 py-3 border border-gray-200 rounded-xl font-medium text-[#1d1d1f] hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="flex-1 px-5 py-3 bg-[#007AFF] text-white rounded-xl font-medium hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Skapar projekt...
              </>
            ) : (
              'Skapa projekt'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
