import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { projectsApi } from '../services/api';

export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Training Program</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Objectives
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
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
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
