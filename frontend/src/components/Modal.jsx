import { createContext, useContext, useState, useCallback, useEffect } from 'react';
const Ctx = createContext(null);
export const useModal = () => useContext(Ctx);
export function ModalProvider({ children }) {
  const [content, setContent] = useState(null);
  const open = useCallback((node) => setContent(() => node), []);
  const close = useCallback(() => setContent(null), []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    if (content) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [content, close]);
  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {content && (
        <div className="modal-bg" onClick={(e) => { if (e.target.classList.contains('modal-bg')) close(); }}>
          <div className="modal">{content}</div>
        </div>
      )}
    </Ctx.Provider>
  );
}
