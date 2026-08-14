import { createContext, useContext, useState, useCallback } from 'react';

const ModalCtx = createContext(null);
export const useModal = () => useContext(ModalCtx);

export function ModalProvider({ children }) {
  const [content, setContent] = useState(null);
  const open = useCallback((node) => setContent(() => node), []);
  const close = useCallback(() => setContent(null), []);
  return (
    <ModalCtx.Provider value={{ open, close }}>
      {children}
      {content && (
        <div className="modal-bg" onClick={(e) => { if (e.target.classList.contains('modal-bg')) close(); }}>
          <div className="modal">{content}</div>
        </div>
      )}
    </ModalCtx.Provider>
  );
}
