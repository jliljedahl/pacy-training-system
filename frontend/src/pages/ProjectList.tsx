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
    const badges: Record<string, { bg: string; text: string; border: string; label: string }> = {
      information_gathering: { 
        bg: 'bg-[#f5f5f7]', 
        text: 'text-[#1d1d1f]', 
        border: 'border-[#d2d2d7]',
        label: 'Gathering Info' 
      },
      program_design: { 
        bg: 'bg-[#e3f2fd]', 
        text: 'text-[#007AFF]', 
        border: 'border-[#007AFF]/20',
        label: 'Program Design' 
      },
      article_creation: { 
        bg: 'bg-[#fff4e6]', 
        text: 'text-[#ff9500]', 
        border: 'border-[#ff9500]/20',
        label: 'Creating Articles' 
      },
      video_creation: { 
        bg: 'bg-[#f3e5f5]', 
        text: 'text-[#af52de]', 
        border: 'border-[#af52de]/20',
        label: 'Creating Videos' 
      },
      quiz_creation: { 
        bg: 'bg-[#e8eaf6]', 
        text: 'text-[#5856d6]', 
        border: 'border-[#5856d6]/20',
        label: 'Creating Quizzes' 
      },
      completed: { 
        bg: 'bg-[#e8f5e9]', 
        text: 'text-[#34c759]', 
        border: 'border-[#34c759]/20',
        label: 'Completed' 
      },
    };

    const badge = badges[status] || badges.information_gathering;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-[#86868b] text-sm font-medium">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#f5f5f7] mb-6">
          <FileText className="h-10 w-10 text-[#86868b]" />
        </div>
        <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-2">No projects yet</h3>
        <p className="text-[#86868b] text-base mb-8 max-w-md mx-auto">
          Create your first training program to get started with AI-powered content creation.
        </p>
        <Link
          to="/onboarding"
          className="premium-button text-white inline-flex items-center"
        >
          Skapa nytt projekt
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] mb-3 tracking-tight">Training Programs</h1>
        <p className="text-[#86868b] text-lg">Manage and create your training content</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-2xl subtle-shadow border border-gray-100/50 p-8 hover-lift group"
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-[#1d1d1f] pr-4 leading-tight group-hover:text-[#007AFF] transition-colors">
                {project.name}
              </h3>
              <button
                onClick={() => deleteProject(project.id)}
                className="text-[#86868b] hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Delete project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-[#86868b]">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{new Date(project.createdAt).toLocaleDateString('sv-SE', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div>{getStatusBadge(project.status)}</div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-[#86868b]">
                  <span className="font-medium text-[#1d1d1f]">Language:</span> {project.language}
                </span>
              </div>
              <div className="text-sm text-[#86868b]">
                <span className="font-medium text-[#1d1d1f]">Deliverables:</span> {project.deliverables.replace(/_/g, ' ')}
              </div>
            </div>

            <Link
              to={`/projects/${project.id}`}
              className="block w-full text-center px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl hover:bg-[#e8e8ed] transition-colors font-medium text-sm"
            >
              View Project
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
