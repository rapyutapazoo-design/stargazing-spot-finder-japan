import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ja } from 'date-fns/locale';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export default function Calendar({ initial, onConfirm, onCancel }) {
  const init = initial ?? new Date();
  const [day, setDay] = useState(init);
  const [time, setTime] = useState(
    `${String(init.getHours()).padStart(2, '0')}:${init.getMinutes() < 30 ? '00' : '30'}`
  );

  const confirm = () => {
    const [hh, mm] = time.split(':').map(Number);
    const d = new Date(day);
    d.setHours(hh, mm, 0, 0);
    onConfirm(d);
  };

  return (
    <div className="sgc-popover" role="dialog" aria-label="観測日時を選択">
      <div className="sgc-scroll">
        <DayPicker
          mode="single"
          required
          locale={ja}
          selected={day}
          onSelect={setDay}
          weekStartsOn={0}
        />
      </div>
      <div className="sgc-timerow">
        <label htmlFor="sgc-time">時刻</label>
        <select id="sgc-time" value={time} onChange={(e) => setTime(e.target.value)}>
          {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="sgc-actions">
        <button type="button" className="sgc-cancel" onClick={onCancel}>キャンセル</button>
        <button type="button" className="sgc-confirm" onClick={confirm}>この日時にする</button>
      </div>
    </div>
  );
}
