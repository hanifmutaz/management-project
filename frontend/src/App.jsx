import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store.jsx';
import { ModalProvider, useModal } from './components/Modal.jsx';
import { Sidebar, BottomNav, ToastHost } from './components/Layout.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { WorkLogForm } from './modals/Forms.jsx';
import Icon from './components/Icon.jsx';
import { SkeletonDash } from './components/ui.jsx';
import { setAppKey } from './lib/api.js';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Tasks from './pages/Tasks.jsx';
import WorkLog from './pages/WorkLog.jsx';
import Finance from './pages/Finance.jsx';
import Analytics from './pages/Analytics.jsx';

// Shown when the backend has APP_PASSWORD set and we either haven't sent a key yet
// or sent a wrong one. Not real per-user auth — just a lock on the front door.
function PasswordGate({ onSubmit }) {
  const [pw, setPw] = useState('');
  return (
    <div className="center-load" style={{ textAlign:'center', padding:20 }}>
      <div style={{ maxWidth:340, width:'100%' }}>
        <b>⌘ MUTAZ OS — Terkunci</b>
        <p style={{ color:'var(--muted)', margin:'8px 0 16px', fontSize:12.5, lineHeight:1.6 }}>Masukin password buat lanjut.</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(pw); }} style={{ display:'flex', gap:8 }}>
          <input type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" style={{ flex:1 }} />
          <button className="btn" type="submit">Masuk</button>
        </form>
      </div>
    </div>
  );
}

function Shell() {
  const [drawer, setDrawer] = useState(false);
  const [cmd, setCmd] = useState(false);
  const { loading, error, projects, refresh } = useStore();
  const { open } = useModal();
  const nav = useNavigate();
  const gKey = useRef(false);

  // keyboard shortcuts: Cmd/Ctrl+K palette, "g" then letter navigasi, "n" quick log
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(true); return; }
      if (typing) return;
      if (e.key === 'g') { gKey.current = true; setTimeout(() => { gKey.current = false; }, 700); return; }
      if (gKey.current) {
        const map = { d:'/', p:'/projects', t:'/tasks', w:'/worklog', f:'/finance', a:'/analytics' };
        if (map[e.key]) { nav(map[e.key]); gKey.current = false; }
        return;
      }
      if (e.key === 'n') { e.preventDefault(); open(<WorkLogForm projects={projects} />); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, open, projects]);

  const onMenu = () => setDrawer(true);
  const onClose = () => setDrawer(false);

  if (loading) return (
    <div className="app">
      <Sidebar open={false} onClose={onClose} onCmd={() => setCmd(true)} />
      <main className="main"><div style={{ marginBottom:20 }}><div className="sk sk-line" style={{ width:220, height:24 }} /></div><SkeletonDash /></main>
    </div>
  );
  if (error === 'Unauthorized') {
    return <PasswordGate onSubmit={(pw) => { setAppKey(pw); refresh(); }} />;
  }
  if (error) return (
    <div className="center-load" style={{ textAlign:'center', padding:20 }}>
      <Icon name="x" size="xl" />
      <div style={{ maxWidth:420 }}>
        <b>Gagal konek ke backend</b>
        <p style={{ color:'var(--muted)', marginTop:8, fontSize:12.5, lineHeight:1.6 }}>{error}<br />Pastikan backend jalan di <code>localhost:4000</code> & database sudah di-seed.</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="app">
        {drawer && <div className="scrim" onClick={onClose} />}
        <Sidebar open={drawer} onClose={onClose} onCmd={() => setCmd(true)} />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard onMenu={onMenu} />} />
            <Route path="/projects" element={<Projects onMenu={onMenu} />} />
            <Route path="/projects/:id" element={<ProjectDetail onMenu={onMenu} />} />
            <Route path="/tasks" element={<Tasks onMenu={onMenu} />} />
            <Route path="/worklog" element={<WorkLog onMenu={onMenu} />} />
            <Route path="/finance" element={<Finance onMenu={onMenu} />} />
            <Route path="/analytics" element={<Analytics onMenu={onMenu} />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
      <button className="fab" onClick={() => open(<WorkLogForm projects={projects} />)} title="Catat kerjaan" aria-label="Catat kerjaan"><Icon name="bolt" /></button>
      {cmd && <CommandPalette onClose={() => setCmd(false)} />}
      <ToastHost />
    </>
  );
}

export default function App() {
  return <StoreProvider><ModalProvider><Shell /></ModalProvider></StoreProvider>;
}
