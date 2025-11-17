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
  
  batchCreateArticles: (chapterId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/chapters/${chapterId}/articles/batch`);

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
  batchCreateAllArticles: (projectId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/projects/${projectId}/articles/batch-all`);

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
  createVideo: (sessionId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/sessions/${sessionId}/video`);

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
  batchCreateVideos: (projectId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/projects/${projectId}/videos/batch`);

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
  approveVideo: (videoId: string) => api.post(`/workflow/videos/${videoId}/approve`),
  createQuiz: (sessionId: string, numQuestions?: number, onProgress?: (message: string) => void) => {
    const url = `/api/workflow/sessions/${sessionId}/quiz${numQuestions ? `?numQuestions=${numQuestions}` : ''}`;
    const eventSource = new EventSource(url);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'progress' && onProgress) {
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
  batchCreateQuizzes: (projectId: string, numQuestions?: number, onProgress?: (message: string) => void) => {
    const url = `/api/workflow/projects/${projectId}/quizzes/batch${numQuestions ? `?numQuestions=${numQuestions}` : ''}`;
    const eventSource = new EventSource(url);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'progress' && onProgress) {
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
  approveQuiz: (quizId: string) => api.post(`/workflow/quizzes/${quizId}/approve`),
  createTestSession: (sessionId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/sessions/${sessionId}/test-session`);

    return new Promise((resolve, reject) => {
      let hasReceivedData = false;
      const timeout = setTimeout(() => {
        if (!hasReceivedData) {
          eventSource.close();
          reject(new Error('Connection timeout - backend may not be running. Check that backend is running on port 3000.'));
        }
      }, 5000);

      eventSource.onopen = () => {
        hasReceivedData = true;
        clearTimeout(timeout);
        onProgress('🔌 Connected to backend...');
      };

      eventSource.onmessage = (event) => {
        hasReceivedData = true;
        clearTimeout(timeout);
        
        try {
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
        } catch (error) {
          console.error('Error parsing SSE data:', error);
          onProgress(`⚠️ Error: ${error}`);
        }
      };

      eventSource.onerror = (error) => {
        eventSource.close();
        clearTimeout(timeout);
        console.error('EventSource error:', error);
        reject(new Error('Connection failed. Make sure backend is running on port 3000.'));
      };
    });
  },
  saveFeedback: (type: 'article' | 'video' | 'quiz', id: string, feedback: string) =>
    api.post(`/workflow/feedback/${type}/${id}`, { feedback }),
  updateContent: (type: 'article' | 'video', id: string, content: string, wordCount?: number) =>
    api.patch(`/workflow/content/${type}/${id}`, { content, wordCount }),
  updateQuizQuestions: (quizId: string, questions: any[]) =>
    api.patch(`/workflow/quizzes/${quizId}/questions`, { questions }),
  batchCreateChapterComplete: (chapterId: string, onProgress: (message: string) => void) => {
    const eventSource = new EventSource(`/api/workflow/chapters/${chapterId}/batch-complete`);

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
