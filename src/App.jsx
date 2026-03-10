import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Trash2,
  Clock,
  Image as ImageIcon,
  Type,
  XCircle,
  Layout,
  Tag,
  X,
  Search,
  Database,
  FileIcon,
} from "lucide-react";
import { useHistory } from "./hooks/useHistory";

const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", {
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
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagInputs, setNewTagInputs] = useState({});

  const { data: groupedHistory = {}, isLoading, invalidate } = useHistory(searchQuery, groupByDate);

  const deleteMutation = useMutation({
    mutationFn: (id) => window.electronAPI?.deleteEntry(id),
    onSuccess: invalidate,
  });

  const updateTagsMutation = useMutation({
    mutationFn: ({ id, tags }) => window.electronAPI?.updateTags(id, tags),
    onSuccess: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: () => window.electronAPI?.clearHistory(),
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

  const deleteEntry = (id) => {
    deleteMutation.mutate(id);
  };

  const clearAll = () => {
    if (window.confirm("Deseja eliminar permanentemente todo o histórico da base de dados?")) {
      clearMutation.mutate();
    }
  };

  const copyToClipboard = (item) => {
    window.electronAPI?.copyToOS(item.type, item.content);
  };

  const renderPreview = (item) => {
    if (item.type === "image") {
      return (
        <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 h-32 w-full max-w-xs">
          <img src={item.content} alt="Preview" className="object-cover w-full h-full" />
        </div>
      );
    }
    if (item.type === "file") {
      const filename = item.content.split("/").pop();
      const dir = item.content.substring(0, item.content.lastIndexOf("/"));
      return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-gray-100 dark:border-neutral-800">
          <FileIcon size={28} className="text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{filename}</p>
            <p className="text-[11px] text-gray-400 font-mono truncate">{dir}</p>
          </div>
        </div>
      );
    }
    const truncated =
      item.content.length > 300 ? item.content.substring(0, 300) + "..." : item.content;
    return (
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono bg-gray-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-gray-100 dark:border-neutral-800 break-all">
        {truncated}
      </p>
    );
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isWidgetMode
          ? "bg-transparent"
          : "bg-gray-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
      }`}
    >
      {/* Header Fixo */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-md border-b px-6 py-4 space-y-4 ${
          isWidgetMode
            ? "hidden"
            : "bg-white/80 dark:bg-neutral-900/80 border-gray-200 dark:border-neutral-800"
        }`}
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
                Persistência SQLite Ativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" }}>
            <button
              onClick={() => setIsWidgetMode(!isWidgetMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <Layout size={18} />
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
            placeholder="Pesquisar no histórico persistente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </header>

      <main
        className={`max-w-4xl mx-auto p-6 ${
          isWidgetMode
            ? "bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl mt-10"
            : ""
        }`}
      >
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Database size={48} className="mb-4 opacity-10" />
            <p>A base de dados está limpa.</p>
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
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative grid grid-cols-[1fr_auto] gap-4 p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-900 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-3">
                        <Clock size={12} />
                        {item.timestamp.toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <span className="mx-1">•</span>
                        {item.type === "text" ? <Type size={12} /> : item.type === "image" ? <ImageIcon size={12} /> : <FileIcon size={12} />}
                        <span className="uppercase text-[10px]">{item.type}</span>
                      </div>

                      <div className="cursor-pointer mb-4" onClick={() => copyToClipboard(item)}>
                        {renderPreview(item)}
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
                          placeholder="Etiqueta..."
                          className="text-[11px] bg-transparent border-b border-dashed border-gray-300 dark:border-neutral-700 focus:border-emerald-500 outline-none px-1 w-20"
                          value={newTagInputs[item.id] || ""}
                          onChange={(e) =>
                            setNewTagInputs({ ...newTagInputs, [item.id]: e.target.value })
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleAddTag(item.id)}
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => deleteEntry(item.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {isWidgetMode && (
        <button
          onClick={() => setIsWidgetMode(false)}
          className="fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-2xl z-50 ring-4 ring-white dark:ring-neutral-900"
        >
          <XCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default App;
