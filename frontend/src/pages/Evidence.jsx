import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { fmtDateTime } from '../lib/format.js';
import { Empty } from '../components/ui.jsx';
import { Topbar } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';

const evColor = { progress:'var(--brand)', issue:'var(--orange)', risk:'var(--yellow)', decision:'var(--brand2)', approval:'var(--green)' };
const evIcon = { progress:'trend', issue:'alert', risk:'shield', decision:'gavel', approval:'gavel' };

export default function Evidence({ onMenu }) {
  const { projects } = useStore();
  const [items, setItems] = useState([]);
  const [pf, setPf] = useState('');
  const [tf, setTf] = useState('');
  const [uf, setUf] = useState('');

  const load = async () => {
    const qs = [];
    if (pf) qs.push('project_id=' + pf);
    if (tf) qs.push('etype=' + tf);
    if (uf) qs.push('user=' + encodeURIComponent(uf));
    setItems(await api.evidence(qs.length ? '?' + qs.join('&') : ''));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pf, tf, uf]);

  return (
    <>
      <Topbar title="Evidence Center" sub="Every update becomes evidence · traceable" onMenu={onMenu} />
      <div className="filters">
        <select value={pf} onChange={e => setPf(e.target.value)}><option value="">Semua Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.project_code}</option>)}</select>
        <select value={tf} onChange={e => setTf(e.target.value)}><option value="">Semua Type</option>{['progress','issue','risk','decision','approval'].map(t => <option key={t}>{t}</option>)}</select>
        <input className="search" value={uf} onChange={e => setUf(e.target.value)} placeholder="Filter by user..." />
      </div>
      <div className="panel">
        <div className="tl">
          {items.length ? items.map((e, i) => (
            <div className="item" key={i}>
              <span className="dotm" style={{ color: evColor[e.etype] || 'var(--gray)' }}><Icon name={evIcon[e.etype] || 'archive'} /></span>
              <b>{e.actor || 'System'}</b> — {e.summary}<span className="ev-type">{e.etype}</span>
              <div className="ts">{fmtDateTime(e.at)} · {e.project_code}</div>
            </div>
          )) : <Empty icon="archive">Belum ada evidence</Empty>}
        </div>
      </div>
    </>
  );
}
