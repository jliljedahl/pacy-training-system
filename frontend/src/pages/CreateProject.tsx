import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Edit3 } from 'lucide-react';
import { projectsApi, BriefExtractionResult } from '../services/api';

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Brief upload mode
  const [mode, setMode] = useState<'manual' | 'upload'>('manual');
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<BriefExtractionResult | null>(null);
  const [parsing, setParsing] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create project
      const response = await projectsApi.create(formData);
      const projectId = response.data.id;

      // Upload files if any
      for (const file of files) {
        await projectsApi.uploadSource(projectId, file, formData.strictFidelity ? 'strict_fidelity' : 'context');
      }

      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create project. Make sure the backend server is running.';
      alert(`Failed to create project:\n\n${errorMessage}\n\nCheck the browser console (F12) for more details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleBriefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setBriefFile(file);
    setParsing(true);

    try {
      const response = await projectsApi.parseBrief(file);
      setExtractedData(response.data);

      // Pre-fill form data with extracted information
      const extracted = response.data.extracted;
      setFormData({
        name: extracted.projectName !== '[NEEDS INPUT]' ? extracted.projectName : '',
        language: extracted.language !== '[NEEDS INPUT]' ? extracted.language : 'swedish',
        learningObjectives: extracted.learningObjectives !== '[NEEDS INPUT]' ? extracted.learningObjectives : '',
        targetAudience: extracted.targetAudience !== '[NEEDS INPUT]' ? extracted.targetAudience : '',
        desiredOutcomes: extracted.desiredOutcomes !== '[NEEDS INPUT]' ? extracted.desiredOutcomes : '',
        constraints: extracted.constraints || '',
        particularAngle: extracted.particularAngle || '',
        deliverables: extracted.deliverables !== '[NEEDS INPUT]' ? extracted.deliverables : 'articles',
        strictFidelity: extracted.strictFidelity,
        quizQuestions: 3,
      });
    } catch (error) {
      console.error('Failed to parse brief:', error);
      alert('Failed to parse brief document. Please try again or fill the form manually.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] mb-3 tracking-tight">Create New Training Program</h1>
        <p className="text-[#86868b] text-lg">Start building your AI-powered training content</p>
      </div>

      {/* Mode Toggle - Premium Design */}
      <div className="mb-10 flex gap-3 bg-white rounded-2xl p-2 subtle-shadow border border-gray-100/50">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'manual'
              ? 'bg-[#007AFF] text-white shadow-sm'
              : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Fill Form Manually
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'upload'
              ? 'bg-[#007AFF] text-white shadow-sm'
              : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Upload Client Brief
        </button>
      </div>

      {/* Brief Upload Section - Premium Design */}
      {mode === 'upload' && !extractedData && (
        <div className="mb-10 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 hover:border-[#007AFF]/30 transition-colors">
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleBriefUpload}
            className="hidden"
            id="brief-upload"
            disabled={parsing}
          />
          <label htmlFor="brief-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-[#007AFF]" />
            </div>
            <span className="text-xl font-semibold text-[#1d1d1f] mb-2">
              Upload Client Brief Document
            </span>
            <span className="text-[#86868b] text-sm mb-6">
              PDF, DOCX, or TXT file containing project information
            </span>
            {parsing && (
              <div className="flex items-center gap-3 text-[#007AFF]">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#007AFF] border-t-transparent"></div>
                <span className="text-sm font-medium">Analyzing brief document...</span>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Extraction Preview */}
      {mode === 'upload' && extractedData && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Brief Extracted Successfully</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and edit the extracted information below before creating the project
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setBriefFile(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Upload Different Brief
            </button>
          </div>

          {/* Show confidence levels and notes */}
          {extractedData.needsHumanInput.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ Some fields need your input:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {extractedData.needsHumanInput.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {extractedData.notes.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-800 mb-2">📝 Notes:</p>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {extractedData.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-2xl p-10 subtle-shadow border border-gray-100/50">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-semibold text-[#1d1d1f] mb-3 flex items-center gap-2">
            Project Name *
            {extractedData && (
              <span
                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  extractedData.confidence.projectName === 'high'
                    ? 'bg-[#e8f5e9] text-[#34c759] border border-[#34c759]/20'
                    : extractedData.confidence.projectName === 'medium'
                    ? 'bg-[#fff4e6] text-[#ff9500] border border-[#ff9500]/20'
                    : 'bg-[#ffe5e5] text-[#ff3b30] border border-[#ff3b30]/20'
                }`}
              >
                {extractedData.confidence.projectName} confidence
              </span>
            )}
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-[#fafafa] text-[#1d1d1f] placeholder:text-[#86868b] transition-all"
            placeholder="e.g., Brand Building Fundamentals"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="swedish">Swedish</option>
            <option value="english">English</option>
          </select>
        </div>

        {/* Learning Objectives */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Learning Objectives
            {extractedData && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  extractedData.confidence.learningObjectives === 'high'
                    ? 'bg-green-100 text-green-800'
                    : extractedData.confidence.learningObjectives === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {extractedData.confidence.learningObjectives} confidence
              </span>
            )}
          </label>
          <textarea
            value={formData.learningObjectives}
            onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What should learners be able to do after completing this program?"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Target Audience
            {extractedData && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  extractedData.confidence.targetAudience === 'high'
                    ? 'bg-green-100 text-green-800'
                    : extractedData.confidence.targetAudience === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {extractedData.confidence.targetAudience} confidence
              </span>
            )}
          </label>
          <textarea
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Who is this training for? Their roles, experience level, context..."
          />
        </div>

        {/* Desired Outcomes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desired Outcomes
          </label>
          <textarea
            value={formData.desiredOutcomes}
            onChange={(e) => setFormData({ ...formData, desiredOutcomes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What behavior changes or skills should result from this training?"
          />
        </div>

        {/* Particular Angle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Particular Angle or Framework
          </label>
          <input
            type="text"
            value={formData.particularAngle}
            onChange={(e) => setFormData({ ...formData, particularAngle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Ehrenberg-Bass principles, Design Thinking, Agile methodology"
          />
        </div>

        {/* Deliverables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables</label>
          <select
            value={formData.deliverables}
            onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="articles">Articles only</option>
            <option value="articles_videos">Articles + Video scripts</option>
            <option value="articles_videos_quizzes">Articles + Videos + Quizzes</option>
            <option value="full_program">Full program (all deliverables)</option>
          </select>
        </div>

        {/* Strict Fidelity */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="strictFidelity"
            checked={formData.strictFidelity}
            onChange={(e) => setFormData({ ...formData, strictFidelity: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="strictFidelity" className="ml-2 text-sm text-gray-700">
            Strict fidelity to source materials (content must match sources exactly)
          </label>
        </div>

        {/* Quiz Questions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Questions per Session
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.quizQuestions}
            onChange={(e) => setFormData({ ...formData, quizQuestions: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Source Materials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Materials (optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="mt-2 text-sm text-gray-600">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-gray-500">PDF, DOCX, TXT, etc.</span>
            </label>
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Selected files:</p>
                <ul className="mt-2 space-y-1">
                  {files.map((file, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 premium-button text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating...
              </span>
            ) : (
              'Create Project'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-200 text-[#1d1d1f] rounded-xl hover:bg-[#f5f5f7] transition-colors font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
