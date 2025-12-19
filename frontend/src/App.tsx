import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import VolumeManager from './components/VolumeManager';
import PolicyPage from './components/PolicyPage';
import OnboardingPage from './components/OnboardingPage';
import { useEffect, useState } from 'react';
import { fetchSession } from './services/auth';
import Layout from './components/Layout';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession()
      .then((isAuthed) => setAuthenticated(isAuthed))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/volumes" element={<VolumeManager />} />
        <Route path="/policies" element={<PolicyPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;
