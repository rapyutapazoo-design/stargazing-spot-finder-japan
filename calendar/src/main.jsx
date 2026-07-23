import { createRoot } from 'react-dom/client';
import 'react-day-picker/style.css';
import './calendar.css';
import Calendar from './Calendar.jsx';

let container = null;
let root = null;
let outsideHandler = null;

function unmount() {
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

function positionContainer(anchorEl) {
  const r = anchorEl.getBoundingClientRect();
  container.style.position = 'absolute';
  container.style.top = `${window.scrollY + r.bottom + 6}px`;
  container.style.left = `${window.scrollX + r.left}px`;
}

export function mount(anchorEl, { initial, onSelect, roundToHalfHour } = {}) {
  unmount();
  container = document.createElement('div');
  document.body.appendChild(container);
  positionContainer(anchorEl);
  root = createRoot(container);

  const handleConfirm = (d) => {
    const finalDate = typeof roundToHalfHour === 'function' ? roundToHalfHour(d) : d;
    unmount();
    if (typeof onSelect === 'function') onSelect(finalDate);
  };

  root.render(
    <Calendar initial={initial} onConfirm={handleConfirm} onCancel={unmount} />
  );

  outsideHandler = (e) => { if (container && !container.contains(e.target) && e.target !== anchorEl) unmount(); };
  setTimeout(() => {
    document.addEventListener('mousedown', outsideHandler, true);
    document.addEventListener('keydown', escHandler, true);
  }, 0);
}

if (typeof window !== 'undefined') {
  window.StargazerCalendar = { mount };
}
