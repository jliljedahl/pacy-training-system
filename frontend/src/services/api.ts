import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to get auth token for EventSource
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Create authenticated EventSource (via fetch with SSE)
export function createAuthenticatedEventSource(
  url: string,
  onMessage: (data: any) => void,
  onError: (error: Error) => void
): () => void {
  let abortController = new AbortController();

  (async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage(data);
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        onError(error);
      }
    }
  })();

  // Return abort function
  return () => abortController.abort();
}

export interface CompanyContextData {
  name: string;
  industry: string;
  description: string;
  tone: string;
  audienceType: string;
}

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
  companyName?: string;
  companyUrl?: string;
  companyContext?: string | CompanyContextData;
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

// Helper to create SSE promise with auth
function createSSEPromise(url: string, onProgress?: (message: string) => void) {
  return new Promise((resolve, reject) => {
    const abort = createAuthenticatedEventSource(
      url,
      (data) => {
        if (data.type === 'progress' && onProgress) {
          onProgress(data.message);
        } else if (data.type === 'complete') {
          resolve(data.result);
        } else if (data.type === 'error') {
          reject(new Error(data.message));
        }
      },
      reject
    );
    // Store abort for potential cleanup
    (window as any).__lastSSEAbort = abort;
  });
}

export const workflowApi = {
  executeProgramDesign: (projectId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/projects/${projectId}/design`, onProgress),

  approveMatrix: (projectId: string) => api.post(`/workflow/projects/${projectId}/approve-matrix`),

  createArticle: (sessionId: string, isFirstArticle: boolean, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/sessions/${sessionId}/article?isFirstArticle=${isFirstArticle}`, onProgress),

  approveArticle: (articleId: string) => api.post(`/workflow/articles/${articleId}/approve`),
  reviseArticle: (articleId: string, feedback: string) =>
    api.post(`/workflow/articles/${articleId}/revise`, { feedback }),
  getProgress: (projectId: string) => api.get(`/workflow/projects/${projectId}/progress`),

  batchCreateArticles: (chapterId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/chapters/${chapterId}/articles/batch`, onProgress),

  batchCreateAllArticles: (projectId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/projects/${projectId}/articles/batch-all`, onProgress),

  createVideo: (sessionId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/sessions/${sessionId}/video`, onProgress),

  batchCreateVideos: (projectId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/projects/${projectId}/videos/batch`, onProgress),

  approveVideo: (videoId: string) => api.post(`/workflow/videos/${videoId}/approve`),

  createQuiz: (sessionId: string, numQuestions?: number, onProgress?: (message: string) => void) => {
    const url = `/api/workflow/sessions/${sessionId}/quiz${numQuestions ? `?numQuestions=${numQuestions}` : ''}`;
    return createSSEPromise(url, onProgress);
  },

  batchCreateQuizzes: (projectId: string, numQuestions?: number, onProgress?: (message: string) => void) => {
    const url = `/api/workflow/projects/${projectId}/quizzes/batch${numQuestions ? `?numQuestions=${numQuestions}` : ''}`;
    return createSSEPromise(url, onProgress);
  },

  approveQuiz: (quizId: string) => api.post(`/workflow/quizzes/${quizId}/approve`),

  createTestSession: (sessionId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/sessions/${sessionId}/test-session`, onProgress),

  saveFeedback: (type: 'article' | 'video' | 'quiz', id: string, feedback: string) =>
    api.post(`/workflow/feedback/${type}/${id}`, { feedback }),

  updateContent: (type: 'article' | 'video', id: string, content: string, wordCount?: number) =>
    api.patch(`/workflow/content/${type}/${id}`, { content, wordCount }),

  updateQuizQuestions: (quizId: string, questions: any[]) =>
    api.patch(`/workflow/quizzes/${quizId}/questions`, { questions }),

  batchCreateChapterComplete: (chapterId: string, onProgress: (message: string) => void) =>
    createSSEPromise(`/api/workflow/chapters/${chapterId}/batch-complete`, onProgress),
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

// Streaming SSE POST helper for debrief chat
async function createSSEPostStream(
  url: string,
  body: any,
  onMessage: (data: any) => void
): Promise<string> {
  const token = await getAuthToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onMessage(data);
          if (data.type === 'text') {
            fullResponse += data.content;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  return fullResponse;
}

export const debriefApi = {
  // Send chat message and get streaming response
  chat: async (
    projectId: string,
    message: string,
    onChunk: (text: string) => void
  ): Promise<string> => {
    return createSSEPostStream(
      `/api/debrief/${projectId}/chat`,
      { message },
      (data) => {
        if (data.type === 'text') {
          onChunk(data.content);
        }
      }
    );
  },

  // Get sources for a project
  getSources: (projectId: string) =>
    api.get<{ sources: Array<{ title: string; excerpt?: string; url?: string }> }>(
      `/debrief/${projectId}/sources`
    ),

  // Clear session history
  clearSession: (projectId: string) =>
    api.delete(`/debrief/${projectId}/session`),
};

export default api;
