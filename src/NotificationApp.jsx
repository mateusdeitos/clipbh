import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import ClipPreview from './components/ClipPreview';

/** @type {{ notificationAPI: import("../notification-preload").NotificationAPI }} */
const win = window;

const NotificationApp = () => {
  const [item, setItem] = useState(null);
  const cardRef = useRef(null);
  const id = Number(new URLSearchParams(window.location.search).get('id'));

  useEffect(() => {
    win.notificationAPI?.getItemData(id).then(setItem);
  }, [id]);

  // After item renders, measure the card's own offsetHeight (not the viewport
  // height) and tell main to resize + show the window.
  useEffect(() => {
    if (!item || !cardRef.current) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const height = cardRef.current?.offsetHeight ?? 0;
        win.notificationAPI?.resize(height);
      });
    });
  }, [item]);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Clipboard Reminder
          </span>
        </div>
        <button
          onClick={() => win.notificationAPI?.dismiss()}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Preview */}
      {item && <ClipPreview item={item} compact />}

      {/* Actions — always visible */}
      <div className="flex gap-2">
        <button
          onClick={() => win.notificationAPI?.focusItem()}
          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
        >
          View Item
        </button>
        <button
          onClick={() => win.notificationAPI?.dismiss()}
          className="py-2 px-4 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs font-medium transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default NotificationApp;
