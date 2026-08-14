import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store.jsx';
import { ModalProvider } from './components/Modal.jsx';
import { Sidebar, BottomNav, ToastHost } from './components/Layout.jsx';
import Login from './components/Login.jsx';
import Icon from './components/Icon.jsx';
import { getToken, getUser } from './lib/api.js';
import Overview from './pages/Overview.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import MyTasks from './pages/MyTasks.jsx';
import IssuesRisks from './pages/IssuesRisks.jsx';
import Approvals from './pages/Approvals.jsx';
import Analytics from './pages/Analytics.jsx';
import Reports from './pages/Reports.jsx';
import Evidence from './pages/Evidence.jsx';

function Shell() {
  const [drawer, setDrawer] = useState(false);
  const { loading } = useStore();
  const onMenu = () => setDrawer(true);
  const onClose = () => setDrawer(false);
  if (loading) return <div className="center-load"><span className="spin" /> Memuat data dari server...</div>;
  return (
    <ModalProvider>
      <div className="app">
        {drawer && <div className="scrim" onClick={onClose} />}
        <Sidebar open={drawer} onClose={onClose} />
        <main className="main">
          <Routes>
            <Route path="/" element={<Overview onMenu={onMenu} />} />
            <Route path="/projects" element={<Projects onMenu={onMenu} />} />
            <Route path="/projects/:id" element={<ProjectDetail onMenu={onMenu} />} />
            <Route path="/my-tasks" element={<MyTasks onMenu={onMenu} />} />
            <Route path="/issues-risks" element={<IssuesRisks onMenu={onMenu} />} />
            <Route path="/approvals" element={<Approvals onMenu={onMenu} />} />
            <Route path="/analytics" element={<Analytics onMenu={onMenu} />} />
            <Route path="/reports" element={<Reports onMenu={onMenu} />} />
            <Route path="/evidence" element={<Evidence onMenu={onMenu} />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
      <ToastHost />
    </ModalProvider>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return <StoreProvider><Shell /></StoreProvider>;
}
