import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useStore } from '../lib/store.jsx';

export function Sidebar({ open, onClose, onCmd }) {
  const { dashboard, projects } = useStore();
  const openTasks = dashboard?.kpi?.open_tasks ?? 0;
  const activeProj = projects.filter(p => p.status === 'active').length;
  const link = ({ isActive }) => (isActive ? 'active' : '');
  const nav = [
    { to:'/', icon:'grid', label:'Dashboard', end:true },
    { to:'/projects', icon:'folder', label:'Projects', cnt:activeProj },
    { to:'/tasks', icon:'check-sq', label:'Tasks', cnt:openTasks },
    { to:'/worklog', icon:'clock', label:'Work Log' },
    { to:'/finance', icon:'wallet', label:'Finance' },
    { to:'/analytics', icon:'chart', label:'Analytics' },
  ];
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo"><div className="mk">M</div>
        <div><b>MUTAZ OS</b><span>Personal Work OS</span></div></div>
      <button className="cmdbtn" onClick={() => { onClose(); onCmd(); }}>
        <Icon name="search" size="sm" /> Cari / Command
        <span className="kb"><kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd></span>
      </button>
      <nav className="nav">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={link} onClick={onClose}>
            <Icon name={n.icon} /> {n.label}{n.cnt > 0 && <span className="cnt">{n.cnt}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="side-foot">
        <span className="who"><Icon name="user" size="sm" /> Mu&rsquo;taz</span>
        <button type="button" className="iconbtn" style={{ width:32, height:32 }} onClick={() => { document.body.classList.toggle('light'); localStorage.setItem('mos_theme', document.body.classList.contains('light') ? 'light' : 'dark'); }} title="Tema" aria-label="Ganti tema terang/gelap"><Icon name="moon" /></button>
      </div>
    </aside>
  );
}
export function BottomNav() {
  const link = ({ isActive }) => (isActive ? 'active' : '');
  const items = [
    { to:'/', icon:'grid', label:'Home', end:true }, { to:'/projects', icon:'folder', label:'Projects' },
    { to:'/worklog', icon:'clock', label:'Log' }, { to:'/finance', icon:'wallet', label:'Finance' },
  ];
  return <nav className="botnav"><div className="bn">{items.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={link}><Icon name={n.icon} />{n.label}</NavLink>)}</div></nav>;
}
export function ToastHost() {
  const { toasts } = useStore();
  return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className={`toast ${t.type === 'err' ? 'err' : ''}`}><Icon name={t.type === 'err' ? 'x' : 'check'} /> <span>{t.msg}</span></div>)}</div>;
}
export function Topbar({ title, sub, onMenu, children }) {
  return (
    <div className="topbar">
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="hamb" onClick={onMenu} aria-label="Buka menu"><Icon name="menu" /></button>
        <div>{title}{sub && <div className="sub">{sub}</div>}</div>
      </div>
      <div className="row">{children}</div>
    </div>
  );
}
