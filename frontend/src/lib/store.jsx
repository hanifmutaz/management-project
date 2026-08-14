// Store: bukan lagi sumber data (itu PostgreSQL). Store = cache + orchestrator.
// Setiap aksi -> panggil API -> refetch -> re-render. Single source of truth = DB.
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from './api.js';

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const tid = useRef(0);

  const toast = useCallback((msg, type) => {
    const id = ++tid.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [d, p, n, a] = await Promise.all([
        api.dashboard(), api.projects(), api.notifications(), api.approvals(),
      ]);
      setDashboard(d); setProjects(p); setNotifications(n); setApprovals(a);
    } catch (e) { toast(e.message, 'err'); }
  }, [toast]);

  // initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setUsers(await api.users());
        await refreshAll();
      } catch (e) { toast(e.message, 'err'); }
      setLoading(false);
    })();
  }, [refreshAll, toast]);

  // ---- action wrappers: panggil API lalu refresh ----
  const withRefresh = useCallback(async (fn, okMsg) => {
    try { const r = await fn(); await refreshAll(); if (okMsg) toast(okMsg); return r; }
    catch (e) { toast(e.message, 'err'); throw e; }
  }, [refreshAll, toast]);

  const value = {
    dashboard, projects, users, notifications, approvals, loading, toasts, toast, refreshAll,

    // projects
    createProject: (d) => withRefresh(() => api.createProject(d), 'Project dibuat ✓'),
    updateProject: (id, d) => withRefresh(() => api.updateProject(id, d), 'Project diperbarui ✓'),
    deleteProject: (id) => withRefresh(() => api.deleteProject(id), 'Project dihapus'),

    // generic entities
    createEntity: (kind, d, msg) => withRefresh(() => api.create(kind, d), msg || 'Tersimpan ✓'),
    updateEntity: (kind, id, d, msg) => withRefresh(() => api.update(kind, id, d), msg || 'Diperbarui ✓'),
    deleteEntity: (kind, id, msg) => withRefresh(() => api.remove(kind, id), msg || 'Dihapus'),

    // approvals
    requestApproval: (d) => withRefresh(() => api.requestApproval(d), 'Permintaan approval terkirim ✓'),
    decideApproval: (id, decision, note) => withRefresh(() => api.decideApproval(id, decision, note),
      decision === 'approved' ? 'Approval disetujui ✓' : 'Approval ditolak'),

    // notifications
    readNotif: (id) => withRefresh(() => api.readNotif(id)),
    readAllNotif: () => withRefresh(() => api.readAllNotif(), 'Semua notifikasi ditandai dibaca'),
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
