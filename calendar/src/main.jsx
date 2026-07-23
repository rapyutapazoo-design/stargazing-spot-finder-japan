import { createRoot } from 'react-dom/client';
import 'react-day-picker/style.css';
import './calendar.css';
import Calendar from './Calendar.jsx';

let container = null;
let root = null;
let outsideHandler = null;
let resizeObserver = null;

function unmount() {
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  if (root) { root.unmount(); root = null; }
  if (container && container.parentNode) container.parentNode.removeChild(container);
  container = null;
  if (outsideHandler) {
    document.removeEventListener('mousedown', outsideHandler, true);
    document.removeEventListener('keydown', escHandler, true);
    outsideHandler = null;
  }
}

function escHandler(e) { if (e.key === 'Escape') unmount(); }

function positionContainer(anchorEl, placement = 'below') {
  const r = anchorEl.getBoundingClientRect();
  const MARGIN = 8;
  const GAP = 6;

  container.style.position = 'fixed';
  if (placement === 'right') {
    container.style.top = `${r.top}px`;
    container.style.left = `${r.right + GAP}px`;
  } else {
    container.style.top = `${r.bottom + GAP}px`;
    container.style.left = `${r.left}px`;
  }
  container.style.visibility = 'hidden';

  const reposition = () => {
    if (!container) return; // unmount済みなら何もしない
    const cw = container.offsetWidth;
    const ch = container.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;

    if (placement === 'right') {
      const spaceRight = vw - r.right - GAP;
      if (cw <= spaceRight) {
        left = r.right + GAP;
      } else {
        // 右に入らない場合は左側へフォールバック、それでも溢れる場合は右端クランプ
        left = Math.max(MARGIN, r.left - GAP - cw);
        if (left + cw > vw - MARGIN) left = vw - cw - MARGIN;
      }
      left = Math.max(MARGIN, left);

      top = r.top;
      if (top + ch > vh - MARGIN) top = vh - ch - MARGIN;
      top = Math.max(MARGIN, top);
    } else {
      const spaceBelow = vh - r.bottom - GAP;
      const spaceAbove = r.top - GAP;
      if (ch <= spaceBelow) {
        top = r.bottom + GAP;
      } else if (ch <= spaceAbove) {
        top = r.top - GAP - ch;
      } else {
        top = Math.max(MARGIN, Math.min(r.bottom + GAP, vh - ch - MARGIN));
      }
      top = Math.max(MARGIN, top);

      left = r.left;
      if (left + cw > vw - MARGIN) left = vw - cw - MARGIN;
      left = Math.max(MARGIN, left);
    }

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    container.style.visibility = 'visible';
  };

  // 初回はrAFで実寸測定後に配置する。react-day-picker側の内部レイアウト
  // 副作用（月グリッドの行数確定など）が初回フレーム後にも実寸へ影響することが
  // あるため、ResizeObserverでサイズ確定まで追従してクランプし直す。
  requestAnimationFrame(reposition);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => reposition());
    resizeObserver.observe(container);
  }
}

export function mount(triggerEl, { initial, onSelect, roundToHalfHour, anchorEl, placement } = {}) {
  unmount();
  container = document.createElement('div');
  document.body.appendChild(container);
  positionContainer(anchorEl || triggerEl, placement || 'below');
  root = createRoot(container);

  const handleConfirm = (d) => {
    const finalDate = typeof roundToHalfHour === 'function' ? roundToHalfHour(d) : d;
    unmount();
    if (typeof onSelect === 'function') onSelect(finalDate);
  };

  root.render(
    <Calendar initial={initial} onConfirm={handleConfirm} onCancel={unmount} />
  );

  outsideHandler = (e) => { if (container && !container.contains(e.target) && e.target !== triggerEl) unmount(); };
  setTimeout(() => {
    document.addEventListener('mousedown', outsideHandler, true);
    document.addEventListener('keydown', escHandler, true);
  }, 0);
}

if (typeof window !== 'undefined') {
  window.StargazerCalendar = { mount };
}
