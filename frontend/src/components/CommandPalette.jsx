import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useStore } from '../lib/store.jsx';
import { useModal } from './Modal.jsx';
import { WorkLogForm, ProjectForm, TaskForm } from '../modals/Forms.jsx';
import { typeLabel } from '../lib/format.js';

// Command Palette (Cmd/Ctrl+K) — navigasi + aksi cepat, khas "OS".
export default function CommandPalette({ onClose }) {
  const nav = useNavigate();
  const { projects } = useStore();
  const { open } = useModal();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const go = (path) => { onClose(); nav(path); };
  const act = (fn) => { onClose(); fn(); };

  const items = useMemo(() => {
    const base = [
      { group:'Aksi', icon:'plus', label:'Catat Kerjaan', sub:'log', run:() => act(() => open(<WorkLogForm projects={projects} />)) },
      { group:'Aksi', icon:'folder', label:'Project Baru', sub:'new', run:() => act(() => open(<ProjectForm />)) },
      { group:'Aksi', icon:'check-sq', label:'Task Baru', sub:'new', run:() => act(() => open(<TaskForm projects={projects} />)) },
      { group:'Navigasi', icon:'grid', label:'Dashboard', sub:'g d', run:() => go('/') },
      { group:'Navigasi', icon:'folder', label:'Projects', sub:'g p', run:() => go('/projects') },
      { group:'Navigasi', icon:'check-sq', label:'Tasks', sub:'g t', run:() => go('/tasks') },
      { group:'Navigasi', icon:'clock', label:'Work Log', sub:'g w', run:() => go('/worklog') },
      { group:'Navigasi', icon:'calendar', label:'Timeline', sub:'g l', run:() => go('/timeline') },
      { group:'Navigasi', icon:'wallet', label:'Finance', sub:'g f', run:() => go('/finance') },
      { group:'Navigasi', icon:'chart', label:'Analytics', sub:'g a', run:() => go('/analytics') },
      { group:'Tampilan', icon:'moon', label:'Toggle Dark / Light', run:() => act(() => { document.body.classList.toggle('light'); localStorage.setItem('mos_theme', document.body.classList.contains('light') ? 'light' : 'dark'); }) },
    ];
    const projItems = projects.map(p => ({ group:'Buka Project', icon:'folder', label:p.name, sub:typeLabel[p.type] || p.type, color:p.color, run:() => go('/projects/' + p.id) }));
    const all = [...base, ...projItems];
    if (!q.trim()) return all;
    const ql = q.toLowerCase();
    return all.filter(i => i.label.toLowerCase().includes(ql) || (i.sub || '').toLowerCase().includes(ql));
  }, [q, projects]); // eslint-disable-line

  useEffect(() => { setSel(0); }, [q]);
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[sel]?.run(); }
    else if (e.key === 'Escape') onClose();
  };

  // group render
  let lastGroup = null;
  return (
    <div className="cmdp-bg" onClick={(e) => { if (e.target.classList.contains('cmdp-bg')) onClose(); }}>
      <div className="cmdp">
        <div className="cin">
          <Icon name="search" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Cari aksi, halaman, atau project..." />
          <kbd>ESC</kbd>
        </div>
        <div className="clist">
          {items.length ? items.map((it, i) => {
            const showGroup = it.group !== lastGroup; lastGroup = it.group;
            return (
              <div key={i}>
                {showGroup && <div className="cgroup">{it.group}</div>}
                <div className={`citem ${i === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={it.run}>
                  <span className="cico" style={it.color ? { color: it.color } : undefined}><Icon name={it.icon} /></span>
                  <span>{it.label}</span>
                  {it.sub && <span className="csub">{it.sub}</span>}
                </div>
              </div>
            );
          }) : <div className="empty" style={{ padding: 30 }}><Icon name="search" size="lg" /><div className="et">Ga ada hasil</div></div>}
        </div>
      </div>
    </div>
  );
}
