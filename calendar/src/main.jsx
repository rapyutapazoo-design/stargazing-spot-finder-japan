import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import 'react-day-picker/style.css';
import './calendar.css';
import Calendar from './Calendar.jsx';

let container = null;
let root = null;
let outsideHandler = null;
let resizeObserver = null;
let closing = false;        // startClose 進行中フラグ（二重close防止）
let closeTimer = null;      // animationend 未発火環境向けフォールバック timer
let animEndHandler = null;  // popover に付けた animationend リスナ参照

// 位置計算：可視制御は一切行わず top/left のみ確定する（同期呼び出し前提）
function positionContainer(anchorEl, placement = 'below') {
  if (!container) return;
  const r = anchorEl.getBoundingClientRect();
  const MARGIN = 8;
  const GAP = 6;
  const cw = container.offsetWidth;   // flushSync 後なので実寸が返る
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
    if (ch <= spaceBelow) top = r.bottom + GAP;
    else if (ch <= spaceAbove) top = r.top - GAP - ch;
    else top = Math.max(MARGIN, Math.min(r.bottom + GAP, vh - ch - MARGIN));
    top = Math.max(MARGIN, top);
    left = r.left;
    if (left + cw > vw - MARGIN) left = vw - cw - MARGIN;
    left = Math.max(MARGIN, left);
  }

  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
  // visibility は一切触らない（container は常に可視）
}

// 全リソースを同期破棄する終端処理。container===null で冪等。
function finalize() {
  if (!container) return;                 // 冪等ガード（二重finalize無害化）
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  if (animEndHandler) {
    const pop = container.querySelector('.sgc-popover');
    if (pop) pop.removeEventListener('animationend', animEndHandler);
    animEndHandler = null;
  }
  if (outsideHandler) {                    // finalizeでも二重に外す（自己完結・冪等）
    document.removeEventListener('mousedown', outsideHandler, true);
    document.removeEventListener('keydown', escHandler, true);
    outsideHandler = null;
  }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  if (root) { root.unmount(); root = null; }
  if (container.parentNode) container.parentNode.removeChild(container);
  container = null;
  closing = false;
}

// 閉じアニメを開始し、終端で finalize する。二重呼び出しは無視。
function startClose() {
  if (!container || closing) return;       // 二重close防止
  closing = true;
  // リスナは「アニメ開始と同時」に即時解除（閉じ中の二重発火・再mount競合を断つ）
  if (outsideHandler) {
    document.removeEventListener('mousedown', outsideHandler, true);
    document.removeEventListener('keydown', escHandler, true);
    outsideHandler = null;
  }
  const popover = container.querySelector('.sgc-popover');
  if (!popover) { finalize(); return; }    // 念のため（DOM欠損時は即終端）
  popover.classList.add('sgc-closing');
  animEndHandler = (e) => {
    if (e.target === popover && e.animationName === 'sgc-pop-out') finalize();
  };
  popover.addEventListener('animationend', animEndHandler);
  closeTimer = setTimeout(finalize, 200);  // アニメ非発火環境のフォールバック（先着でfinalize）
}

function escHandler(e) { if (e.key === 'Escape') startClose(); }

export function mount(triggerEl, { initial, onSelect, roundToHalfHour, anchorEl, placement } = {}) {
  // 再入：既存インスタンスをアニメ無しで同期破棄（closeTimer も clear され競合しない）
  closing = false;
  finalize();

  container = document.createElement('div');
  container.style.position = 'fixed';   // 採寸を body フローから隔離
  container.style.top = '-9999px';      // 採寸中の一瞬の誤位置露出を防ぐ画面外初期値
  container.style.left = '-9999px';
  document.body.appendChild(container);
  root = createRoot(container);

  const handleConfirm = (d) => {
    const finalDate = typeof roundToHalfHour === 'function' ? roundToHalfHour(d) : d;
    if (typeof onSelect === 'function') onSelect(finalDate); // 値反映を先行（遅延させない）
    startClose();                                            // アニメは並走
  };

  // 同期採寸の核：flushSync で React コミットを同期確定
  flushSync(() => {
    root.render(
      <Calendar initial={initial} onConfirm={handleConfirm} onCancel={startClose} />
    );
  });

  const anchor = anchorEl || triggerEl;
  const place = placement || 'below';
  positionContainer(anchor, place);   // 同期で正位置確定 → 初回から可視・正位置

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => positionContainer(anchor, place));
    resizeObserver.observe(container);
  }

  outsideHandler = (e) => {
    if (container && !container.contains(e.target) && e.target !== triggerEl) startClose();
  };
  const registered = outsideHandler;  // このmount世代のハンドラを捕捉
  setTimeout(() => {
    if (!container || closing || outsideHandler !== registered) return;
    document.addEventListener('mousedown', outsideHandler, true);
    document.addEventListener('keydown', escHandler, true);
  }, 0);
}

if (typeof window !== 'undefined') {
  window.StargazerCalendar = { mount };
}
