import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Trash2,
  Clock,
  Image as ImageIcon,
  Type,
  Tag,
  X,
  Search,
  Database,
  FileIcon,
  Check,
  Pause,
  Bell,
  BellOff,
  Sun,
  Moon,
} from "lucide-react";
import { useHistory } from "./hooks/useHistory";
import { useToggleWatch, useWatchStatus } from "./hooks/useWatchStatus";
import { useSnoozes, formatRemaining } from "./hooks/useSnoozes";
import { useTheme } from "./hooks/useTheme";
import SnoozeModal from "./components/SnoozeModal";
import ClipPreview from "./components/ClipPreview";

/** @type {{ electronAPI: import("../preload").ElectronAPI }} */
const win = window;

const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const groupByDate = (history) => {
  const groups = {};
  history.forEach((item) => {
    const dateKey = formatDate(item.timestamp);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(item);
  });
  return groups;
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagInputs, setNewTagInputs] = useState({});
  const [toast, setToast] = useState(null);
  const [snoozeModal, setSnoozeModal] = useState(null);

  const { data: groupedHistory = {}, isLoading, invalidate } = useHistory(searchQuery, groupByDate);
  const { data: isWatching = true } = useWatchStatus();
  const toggleWatchMutation = useToggleWatch();
  const { snoozedUntil, highlightedId, itemRefs, snooze, cancelSnooze } = useSnoozes();
  const { theme, toggleTheme } = useTheme();

  const deleteMutation = useMutation({
    mutationFn: (id) => win.electronAPI?.deleteEntry(id),
    onSuccess: invalidate,
  });

  const updateTagsMutation = useMutation({
    mutationFn: ({ id, tags }) => win.electronAPI?.updateTags(id, tags),
    onSuccess: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: () => win.electronAPI?.clearHistory(),
    onSuccess: invalidate,
  });

  const itemsById = useMemo(
    () => Object.fromEntries(Object.values(groupedHistory).flat().map((h) => [h.id, h])),
    [groupedHistory]
  );

  const handleAddTag = (itemId) => {
    const tagValue = newTagInputs[itemId]?.trim();
    if (!tagValue) return;

    const item = itemsById[itemId];
    if (!item) return;

    const updatedTags = [...(item.tags || [])];
    if (!updatedTags.includes(tagValue.toLowerCase())) {
      updatedTags.push(tagValue.toLowerCase());
      updateTagsMutation.mutate({ id: itemId, tags: updatedTags });
    }

    setNewTagInputs({ ...newTagInputs, [itemId]: "" });
  };

  const handleRemoveTag = (itemId, tagToRemove) => {
    const item = itemsById[itemId];
    if (!item) return;
    const updatedTags = item.tags.filter((t) => t !== tagToRemove);
    updateTagsMutation.mutate({ id: itemId, tags: updatedTags });
  };

  const deleteEntry = (id) => deleteMutation.mutate(id);

  const clearAll = () => {
    if (window.confirm("Permanently delete all clipboard history?")) {
      clearMutation.mutate();
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const copyToClipboard = (item) => {
    win.electronAPI?.copyToOS(item.type, item.content);
    showToast("Copied to clipboard");
  };

  const handleSnoozeConfirm = (id, durationMs) => {
    setSnoozeModal(null);
    snooze(id, durationMs);
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md border-b px-6 py-4 space-y-4 bg-white/80 dark:bg-neutral-900/80 border-gray-200 dark:border-neutral-800"
        style={{ WebkitAppRegion: "drag" }}
      >
        <div className="flex items-center justify-between" style={{ paddingLeft: "72px" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-500/20">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ClipDB</h1>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">
                SQLite Persistence Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" }}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => toggleWatchMutation.mutate()}
              title={isWatching ? "Pause monitoring" : "Resume monitoring"}
              className="p-2 rounded-lg transition-colors text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              {isWatching ? (
                <div className="animate-spin rounded-full h-[18px] w-[18px] border-2 border-emerald-500 border-t-transparent" />
              ) : (
                <Pause size={18} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={clearAll}
              disabled={Object.keys(groupedHistory).length === 0}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="relative" style={{ WebkitAppRegion: "no-drag" }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search clipboard history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Database size={48} className="mb-4 opacity-10" />
            <p>No clipboard history yet.</p>
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, items]) => (
            <section key={date} className="mb-10">
              <div className="flex items-center gap-2 mb-4 border-l-2 border-emerald-500 pl-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {date}
                </h2>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const isSnoozed = !!snoozedUntil[item.id];
                  const remaining = isSnoozed ? formatRemaining(snoozedUntil[item.id]) : null;
                  const isHighlighted = highlightedId === item.id;

                  return (
                    <div
                      key={item.id}
                      ref={(el) => { itemRefs.current[item.id] = el; }}
                      className={`group relative grid grid-cols-[1fr_auto] gap-4 p-5 bg-white dark:bg-neutral-900 border rounded-2xl hover:shadow-xl transition-all ${
                        isHighlighted
                          ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-xl'
                          : 'border-gray-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-900'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-3">
                          <Clock size={12} />
                          {item.timestamp.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="mx-1">•</span>
                          {item.type === "text" ? <Type size={12} /> : item.type === "image" ? <ImageIcon size={12} /> : <FileIcon size={12} />}
                          <span className="uppercase text-[10px]">{item.type}</span>
                          {isSnoozed && remaining && (
                            <>
                              <span className="mx-1">•</span>
                              <Bell size={12} className="text-amber-500" />
                              <span className="text-amber-500 text-[10px] font-semibold">
                                Snooze: {remaining}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="cursor-pointer mb-4" onClick={() => copyToClipboard(item)}>
                          <ClipPreview item={item} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Tag size={12} className="text-gray-400" />
                          {item.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-full border border-emerald-100 dark:border-emerald-800"
                            >
                              #{tag}
                              <button onClick={() => handleRemoveTag(item.id, tag)}>
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="Tag..."
                            className="text-[11px] bg-transparent border-b border-dashed border-gray-300 dark:border-neutral-700 focus:border-emerald-500 outline-none px-1 w-20"
                            value={newTagInputs[item.id] || ""}
                            onChange={(e) =>
                              setNewTagInputs({ ...newTagInputs, [item.id]: e.target.value })
                            }
                            onKeyDown={(e) => e.key === "Enter" && handleAddTag(item.id)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {isSnoozed ? (
                          <button
                            onClick={() => cancelSnooze(item.id)}
                            title="Cancel snooze"
                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <BellOff size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setSnoozeModal(item.id)}
                            title="Snooze"
                            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-gray-400 hover:text-emerald-500 transition-colors"
                          >
                            <Bell size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteEntry(item.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {snoozeModal !== null && (
        <SnoozeModal
          itemId={snoozeModal}
          onConfirm={handleSnoozeConfirm}
          onCancel={() => setSnoozeModal(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-full shadow-xl animate-fade-in z-50">
          <Check size={14} className="text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
