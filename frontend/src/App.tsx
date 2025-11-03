import { Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
