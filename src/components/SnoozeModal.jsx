import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';

const PRESETS = [
  { label: '5 min', ms: 5 * 60 * 1000 },
  { label: '15 min', ms: 15 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hr', ms: 60 * 60 * 1000 },
];

const SnoozeModal = ({ itemId, onConfirm, onCancel }) => {
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState('minutes');

  const handlePreset = (ms) => {
    onConfirm(itemId, ms);
  };

  const handleCustomConfirm = () => {
    const num = parseFloat(customValue);
    if (!num || num <= 0) return;
    const ms = customUnit === 'hours' ? num * 60 * 60 * 1000 : num * 60 * 1000;
    onConfirm(itemId, ms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Snooze for…</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.ms)}
              className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-100 dark:border-emerald-800"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder="Custom"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            className="w-16 shrink-0 px-2 py-2 text-sm rounded-xl bg-gray-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="minutes">min</option>
            <option value="hours">hr</option>
          </select>
          <button
            onClick={handleCustomConfirm}
            disabled={!customValue || parseFloat(customValue) <= 0}
            className="shrink-0 px-4 py-2 text-sm rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnoozeModal;
