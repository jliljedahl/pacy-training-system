import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, ArrowRight, Building2, X, AlertCircle } from 'lucide-react';
import { projectsApi } from '../services/api';

interface ExtractedBrief {
  extracted: {
    projectName: string;
    learningObjectives: string;
    targetAudience: string;
    desiredOutcomes: string;
    deliverables: string;
    numChapters: number | null;
    constraints: string | null;
    particularAngle: string | null;
    language: string;
    strictFidelity: boolean;
  };
  confidence: Record<string, 'high' | 'medium' | 'low'>;
  notes: string[];
  needsHumanInput: string[];
}

export default function UploadBrief() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get company context from previous step
  const companyContextStr = sessionStorage.getItem('companyContext');
  const companyContext = companyContextStr ? JSON.parse(companyContextStr) : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedData(null);
      setError(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const response = await projectsApi.parseBrief(file);
      setExtractedData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to parse brief');
    } finally {
      setParsing(false);
    }
  };

  const handleContinue = () => {
    if (extractedData) {
      // Store the extracted brief data
      sessionStorage.setItem(
        'interviewBrief',
        JSON.stringify({
          status: 'complete',
          brief: extractedData.extracted,
          source: 'upload',
        })
      );
      navigate('/projects/new');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setExtractedData(null);
      setError(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-semibold text-[#1d1d1f] mb-3">Ladda upp din brief</h1>
        <p className="text-[#86868b]">Vi analyserar dokumentet och extraherar utbildningskraven.</p>
      </div>

      {/* Company context badge */}
      {companyContext && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {companyContext.company?.name}
          </span>
        </div>
      )}

      {!extractedData ? (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
              file ? 'border-green-300 bg-green-50/30' : 'border-gray-200 hover:border-[#007AFF]/30'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#1d1d1f]">{file.name}</p>
                  <p className="text-sm text-[#86868b]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="brief-upload"
                />
                <label htmlFor="brief-upload" className="cursor-pointer">
                  <div className="w-16 h-16 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#86868b]" />
                  </div>
                  <p className="font-medium text-[#1d1d1f] mb-1">
                    Dra och släpp eller klicka för att ladda upp
                  </p>
                  <p className="text-sm text-[#86868b]">PDF, DOCX eller TXT</p>
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-5 py-3 border border-gray-200 rounded-xl font-medium text-[#1d1d1f] hover:bg-gray-50 transition-colors"
            >
              Tillbaka
            </button>
            <button
              onClick={handleParse}
              disabled={!file || parsing}
              className="flex-1 px-5 py-3 bg-[#007AFF] text-white rounded-xl font-medium hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {parsing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Analyserar...
                </>
              ) : (
                <>
                  Analysera brief
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Extracted Data Preview */
        <div className="space-y-6">
          {/* Warnings */}
          {extractedData.needsHumanInput.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="font-medium text-yellow-800 mb-2 text-sm">
                Följande fält behöver granskas:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1">
                {extractedData.needsHumanInput.map((field, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Fields */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#1d1d1f]">Projektnamn</label>
                <ConfidenceBadge level={extractedData.confidence.projectName} />
              </div>
              <p className="text-[#1d1d1f] bg-[#f5f5f7] rounded-lg p-3">
                {extractedData.extracted.projectName || '[Ej angivet]'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#1d1d1f]">Lärandemål</label>
                <ConfidenceBadge level={extractedData.confidence.learningObjectives} />
              </div>
              <p className="text-[#1d1d1f] bg-[#f5f5f7] rounded-lg p-3 text-sm">
                {extractedData.extracted.learningObjectives || '[Ej angivet]'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#1d1d1f]">Målgrupp</label>
                <ConfidenceBadge level={extractedData.confidence.targetAudience} />
              </div>
              <p className="text-[#1d1d1f] bg-[#f5f5f7] rounded-lg p-3 text-sm">
                {extractedData.extracted.targetAudience || '[Ej angivet]'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#1d1d1f]">Önskade resultat</label>
                <ConfidenceBadge level={extractedData.confidence.desiredOutcomes} />
              </div>
              <p className="text-[#1d1d1f] bg-[#f5f5f7] rounded-lg p-3 text-sm">
                {extractedData.extracted.desiredOutcomes || '[Ej angivet]'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1d1d1f] block mb-1">Språk</label>
                <p className="text-[#1d1d1f] bg-[#f5f5f7] rounded-lg p-3 text-sm">
                  {extractedData.extracted.language === 'swedish' ? 'Svenska' : 'Engelska'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1d1d1f] block mb-1">Leverabler</label>
                <p className="text-[#1d1d1f] bg-[#f5f5f7] rounded-lg p-3 text-sm">
                  {extractedData.extracted.deliverables || 'Artiklar'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {extractedData.notes.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="font-medium text-blue-900 mb-2 text-sm">Anteckningar</p>
              <ul className="text-sm text-blue-800 space-y-1">
                {extractedData.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setExtractedData(null);
                setFile(null);
              }}
              className="px-5 py-3 border border-gray-200 rounded-xl font-medium text-[#1d1d1f] hover:bg-gray-50 transition-colors"
            >
              Ladda upp annan fil
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-5 py-3 bg-[#007AFF] text-white rounded-xl font-medium hover:bg-[#0066d6] transition-colors flex items-center justify-center gap-2"
            >
              Skapa projekt
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ level }: { level?: 'high' | 'medium' | 'low' }) {
  if (!level) return null;

  const styles = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  };

  const labels = {
    high: 'Hög',
    medium: 'Medel',
    low: 'Låg',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}
