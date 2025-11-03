import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { projectsApi, Project } from '../services/api';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsApi.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      information_gathering: { color: 'bg-gray-100 text-gray-800', text: 'Gathering Info' },
      program_design: { color: 'bg-blue-100 text-blue-800', text: 'Program Design' },
      article_creation: { color: 'bg-yellow-100 text-yellow-800', text: 'Creating Articles' },
      video_creation: { color: 'bg-purple-100 text-purple-800', text: 'Creating Videos' },
      quiz_creation: { color: 'bg-indigo-100 text-indigo-800', text: 'Creating Quizzes' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
    };

    const badge = badges[status] || badges.information_gathering;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new training program.</p>
        <div className="mt-6">
          <Link
            to="/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create New Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Training Programs</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <button
                onClick={() => deleteProject(project.id)}
                className="text-gray-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div>{getStatusBadge(project.status)}</div>
              <div className="text-sm text-gray-600">
                <strong>Language:</strong> {project.language}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Deliverables:</strong> {project.deliverables}
              </div>
            </div>

            <Link
              to={`/projects/${project.id}`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Project
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
