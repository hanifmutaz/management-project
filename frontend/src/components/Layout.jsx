import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useStore } from '../lib/store.jsx';
import { todayLabel } from '../lib/format.js';

export function Sidebar({ open, onClose }) {
  const { dashboard, projects } = useStore();
  const openTasks = (dashboard?.tasks || []).filter(t => t.status !== 'done').length;
  const activeProj = projects.filter(p => p.status === 'active').length;
  const link = ({ isActive }) => (isActive ? 'active' : '');
  const nav = [
    { to:'/', icon:'grid', label:'Dashboard', end:true },
    { to:'/projects', icon:'folder', label:'Projects', cnt:activeProj },
    { to:'/tasks', icon:'check-sq', label:'Tasks', cnt:openTasks },
    { to:'/worklog', icon:'clock', label:'Work Log' },
    { to:'/timeline', icon:'calendar', label:'Timeline' },
    { to:'/finance', icon:'wallet', label:'Finance' },
    { to:'/analytics', icon:'chart', label:'Analytics' },
  ];
  const toggleTheme = () => {
    document.body.classList.toggle('light');
    try { localStorage.setItem('mos_theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch { /* storage blocked */ }
  };
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo"><div className="mk">M</div>
        <div><b>MUTAZ OS</b><span>Personal Work OS</span></div></div>
      <nav className="nav">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={link} onClick={onClose}>
            <Icon name={n.icon} /> {n.label}{n.cnt > 0 && <span className="cnt">{n.cnt}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="side-foot">
        <span className="who"><Icon name="user" size="sm" /> Mu&rsquo;taz</span>
        <button type="button" className="iconbtn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle light/dark theme">
          <span className="theme-dark"><Icon name="sun" /></span><span className="theme-light"><Icon name="moon" /></span>
        </button>
      </div>
    </aside>
  );
}

// Global top bar: search / command palette, today's date, and the main action.
export function AppBar({ onMenu, onCmd, onLog }) {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  return (
    <header className="appbar">
      <button className="hamb" onClick={onMenu} aria-label="Open menu"><Icon name="menu" /></button>
      <button className="appsearch" onClick={onCmd}>
        <Icon name="search" size="sm" /> <span className="ph">Search or type a command...</span>
        <span className="kb"><kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd></span>
      </button>
      <span className="appspace" />
      <span className="appdate">{todayLabel()}</span>
      <button className="btn" onClick={onLog}><Icon name="plus" /> <span className="lbl">Log Work</span></button>
    </header>
  );
}

export function BottomNav() {
  const link = ({ isActive }) => (isActive ? 'active' : '');
  const items = [
    { to:'/', icon:'grid', label:'Home', end:true }, { to:'/projects', icon:'folder', label:'Projects' },
    { to:'/tasks', icon:'check-sq', label:'Tasks' }, { to:'/worklog', icon:'clock', label:'Log' },
  ];
  return <nav className="botnav"><div className="bn">{items.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={link}><Icon name={n.icon} />{n.label}</NavLink>)}</div></nav>;
}
export function ToastHost() {
  const { toasts } = useStore();
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast ${t.type === 'err' ? 'err' : ''}`}><Icon name={t.type === 'err' ? 'x' : 'check'} /> <span>{t.msg}</span></div>)}</div>;
}
export function Topbar({ title, sub, children }) {
  return (
    <div className="topbar">
      <div>{title}{sub && <div className="sub">{sub}</div>}</div>
      <div className="row">{children}</div>
    </div>
  );
}
