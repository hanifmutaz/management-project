import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const tid = useRef(0);

  const toast = useCallback((msg, type) => {
    const id = ++tid.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([api.dashboard(), api.projects()]);
      setDashboard(d); setProjects(p); setError('');
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { (async () => { setLoading(true); await refresh(); setLoading(false); })(); }, [refresh]);

  const withRefresh = useCallback(async (fn, ok) => {
    try { const r = await fn(); await refresh(); if (ok) toast(ok); return r; }
    catch (e) { toast(e.message, 'err'); throw e; }
  }, [refresh, toast]);

  const value = {
    dashboard, projects, loading, error, toasts, toast, refresh,
    createProject: (d) => withRefresh(() => api.createProject(d), 'Project dibuat'),
    updateProject: (id, d) => withRefresh(() => api.updateProject(id, d), 'Project diperbarui'),
    deleteProject: (id) => withRefresh(() => api.deleteProject(id), 'Project dihapus'),
    pinProject: (id) => withRefresh(() => api.pinProject(id)),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
