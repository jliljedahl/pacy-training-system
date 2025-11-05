import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Project {
  id: string;
  name: string;
  status: string;
  language: string;
  learningObjectives?: string;
  targetAudience?: string;
  desiredOutcomes?: string;
  constraints?: string;
  particularAngle?: string;
  deliverables: string;
  numChapters?: number;
  strictFidelity: boolean;
  quizQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface BriefExtractionResult {
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

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getOne: (id: string) => api.get<any>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) => api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  uploadSource: (id: string, file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post(`/projects/${id}/source-materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  parseBrief: (file: File) => {
    const formData = new FormData();
    formData.append('brief', file);
    return api.post<BriefExtractionResult>('/projects/parse-brief', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const workflowApi = {
  executeProgramDesign: (projectId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/projects/${projectId}/design`);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          onProgress(data.message);
        } else if (data.type === 'complete') {
          eventSource.close();
          resolve(data.result);
        } else if (data.type === 'error') {
          eventSource.close();
          reject(new Error(data.message));
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('Connection failed'));
      };
    });
  },

  approveMatrix: (projectId: string) => api.post(`/workflow/projects/${projectId}/approve-matrix`),

  createArticle: (sessionId: string, isFirstArticle: boolean, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/sessions/${sessionId}/article`);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          onProgress(data.message);
        } else if (data.type === 'complete') {
          eventSource.close();
          resolve(data.result);
        } else if (data.type === 'error') {
          eventSource.close();
          reject(new Error(data.message));
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('Connection failed'));
      };
    });
  },

  approveArticle: (articleId: string) => api.post(`/workflow/articles/${articleId}/approve`),
  reviseArticle: (articleId: string, feedback: string) =>
    api.post(`/workflow/articles/${articleId}/revise`, { feedback }),
  getProgress: (projectId: string) => api.get(`/workflow/projects/${projectId}/progress`),
};

export const contentApi = {
  getChapters: (projectId: string) => api.get(`/content/projects/${projectId}/chapters`),
  createChapter: (projectId: string, data: any) =>
    api.post(`/content/projects/${projectId}/chapters`, data),
  createSession: (chapterId: string, data: any) =>
    api.post(`/content/chapters/${chapterId}/sessions`, data),
  getArticle: (articleId: string) => api.get(`/content/articles/${articleId}`),
  updateArticle: (articleId: string, data: any) =>
    api.patch(`/content/articles/${articleId}`, data),
  getMatrix: (projectId: string) => api.get(`/content/projects/${projectId}/matrix`),
  exportProject: (projectId: string) =>
    api.get(`/content/projects/${projectId}/export`, { responseType: 'blob' }),
};

export default api;
