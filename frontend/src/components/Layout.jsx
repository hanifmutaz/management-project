import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useStore } from '../lib/store.jsx';
import { getUser, logout } from '../lib/api.js';
import { initials, fmtDateTime } from '../lib/format.js';

const NAV = [
  { to:'/', icon:'grid', label:'Overview', end:true },
  { to:'/projects', icon:'folder', label:'Projects' },
  { to:'/my-tasks', icon:'check-sq', label:'My Tasks' },
  { to:'/issues-risks', icon:'alert', label:'Issues & Risks' },
  { to:'/approvals', icon:'gavel', label:'Approvals', badge:true },
];
const NAV2 = [
  { to:'/analytics', icon:'chart', label:'Analytics' },
  { to:'/reports', icon:'doc', label:'Reports' },
  { to:'/evidence', icon:'archive', label:'Evidence Center' },
];

export function Sidebar({ open, onClose }) {
  const { approvals } = useStore();
  const user = getUser();
  const pending = approvals.filter(a => a.status === 'pending').length;
  const link = ({ isActive }) => (isActive ? 'active' : '');
  const toggleTheme = () => { document.body.classList.toggle('light'); localStorage.setItem('ph_theme', document.body.classList.contains('light') ? 'light' : 'dark'); };
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo"><div className="mk"><Icon name="layers" /></div>
        <div><b>ProjectHub</b><span>Monitoring & Reporting</span></div></div>
      <nav className="nav">
        <div className="lbl">Workspace</div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={link} onClick={onClose}>
            <Icon name={n.icon} /> {n.label}{n.badge && pending > 0 && <span className="badge-n">{pending}</span>}
          </NavLink>
        ))}
        <div className="lbl">Insight</div>
        {NAV2.map(n => <NavLink key={n.to} to={n.to} className={link} onClick={onClose}><Icon name={n.icon} /> {n.label}</NavLink>)}
      </nav>
      <div className="side-foot">
        <div className="userbox">
          <div className="ava-lg">{initials(user?.name)}</div>
          <div style={{ flex:1, minWidth:0 }}><b style={{ fontSize:12.5 }}>{user?.name}</b><span style={{ fontSize:10.5, color:'var(--muted)', display:'block', textTransform:'capitalize' }}>{user?.role}</span></div>
          <span className="iconbtn" style={{ width:32, height:32 }} onClick={toggleTheme} title="Tema"><Icon name="moon" /></span>
          <span className="iconbtn" style={{ width:32, height:32 }} onClick={() => { logout(); window.location.reload(); }} title="Logout"><Icon name="logout" /></span>
        </div>
      </div>
    </aside>
  );
}

export function NotifBell() {
  const { notifications, readNotif, readAllNotif } = useStore();
  const [open, setOpen] = useState(false);
  const kindStyle = {
    issue:{ ic:'alert', c:'var(--red)', bg:'rgba(248,113,113,.15)' },
    overdue:{ ic:'clock', c:'var(--orange)', bg:'rgba(251,146,60,.16)' },
    due:{ ic:'clock', c:'var(--orange)', bg:'rgba(251,146,60,.16)' },
    approval:{ ic:'gavel', c:'var(--brand)', bg:'rgba(91,140,255,.16)' },
    assigned:{ ic:'check-sq', c:'var(--brand)', bg:'rgba(91,140,255,.16)' },
    health:{ ic:'shield', c:'var(--green)', bg:'rgba(52,211,153,.15)' },
    info:{ ic:'bell', c:'var(--muted)', bg:'var(--panel3)' },
  };
  const unread = notifications.filter(n => !n.is_read).length;
  return (
    <div className="dd" style={{ position:'relative' }}>
      <button className="iconbtn" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}><Icon name="bell" />{unread > 0 && <span className="ndot" />}</button>
      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:49 }} onClick={() => setOpen(false)} />
          <div className="dd-menu notif" style={{ zIndex:50 }}>
            <div className="nh"><b>Notifications</b><a onClick={() => readAllNotif()}>Tandai sudah dibaca</a></div>
            <div className="nl">
              {notifications.length ? notifications.map(n => { const s = kindStyle[n.kind] || kindStyle.info; return (
                <div key={n.id} className={`nitem ${n.is_read ? '' : 'unread'}`} onClick={() => readNotif(n.id)}>
                  <span className="nic" style={{ background:s.bg, color:s.c }}><Icon name={s.ic} /></span>
                  <div><div className="nt">{n.title}</div><div className="nts">{fmtDateTime(n.created_at)}{n.project_code ? ' · ' + n.project_code : ''}</div></div>
                </div>
              ); }) : <div className="empty" style={{ padding:20 }}><Icon name="bell" size="lg" /><span>Tidak ada notifikasi</span></div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ToastHost() {
  const { toasts } = useStore();
  return (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type === 'err' ? 'err' : ''}`}><Icon name={t.type === 'err' ? 'x' : 'check'} /> <span>{t.msg}</span></div>)}
    </div>
  );
}

export function BottomNav() {
  const link = ({ isActive }) => (isActive ? 'active' : '');
  const items = [
    { to:'/', icon:'grid', label:'Overview', end:true }, { to:'/projects', icon:'folder', label:'Projects' },
    { to:'/my-tasks', icon:'check-sq', label:'Tasks' }, { to:'/approvals', icon:'gavel', label:'Approve' },
    { to:'/evidence', icon:'archive', label:'Evidence' },
  ];
  return <nav className="botnav"><div className="bn">{items.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={link}><Icon name={n.icon} />{n.label}</NavLink>)}</div></nav>;
}

export function Topbar({ title, sub, onMenu, children }) {
  return (
    <div className="topbar">
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="hamb" onClick={onMenu}><Icon name="menu" /></button>
        <div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
      </div>
      <div className="row">{children}</div>
    </div>
  );
}
