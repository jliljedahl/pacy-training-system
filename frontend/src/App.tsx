import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectList from './pages/ProjectList';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import DebriefView from './pages/DebriefView';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import InterviewChat from './pages/InterviewChat';
import UploadBrief from './pages/UploadBrief';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Layout>
                <Onboarding />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/interview"
          element={
            <ProtectedRoute>
              <Layout>
                <InterviewChat />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/upload-brief"
          element={
            <ProtectedRoute>
              <Layout>
                <UploadBrief />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateProject />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/debrief"
          element={
            <ProtectedRoute>
              <Layout>
                <DebriefView />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
