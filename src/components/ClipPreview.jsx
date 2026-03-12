import React from 'react';
import { FileIcon } from 'lucide-react';

const ClipPreview = ({ item, compact = false }) => {
  if (item.type === 'image') {
    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 w-full ${
          compact ? 'h-20 max-w-full' : 'h-32 max-w-xs'
        }`}
      >
        <img src={item.content} alt="Preview" className="object-cover w-full h-full" />
      </div>
    );
  }

  if (item.type === 'file') {
    const filename = item.content.split('/').pop();
    const dir = item.content.substring(0, item.content.lastIndexOf('/'));
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <FileIcon size={compact ? 20 : 28} className="text-emerald-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{filename}</p>
          <p className="text-[11px] text-gray-400 font-mono truncate">{dir}</p>
        </div>
      </div>
    );
  }

  const maxChars = compact ? 120 : 300;
  const truncated =
    item.content.length > maxChars ? item.content.substring(0, maxChars) + '…' : item.content;
  return (
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono bg-gray-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-gray-100 dark:border-neutral-800 break-all">
      {truncated}
    </p>
  );
};

export default ClipPreview;
