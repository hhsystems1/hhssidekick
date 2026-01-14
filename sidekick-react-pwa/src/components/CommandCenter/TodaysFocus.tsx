/**
 * TodaysFocus Component
 * Primary focus card for the Command Center
 */

import React, { useState } from 'react';
import type { FocusItem } from './CommandCenter.types';

interface TodaysFocusProps {
  focusItem?: FocusItem | null;
  onPrimaryAction?: (item: FocusItem) => void;
  onAddFocus?: () => void;
}

export const TodaysFocus: React.FC<TodaysFocusProps> = ({
  focusItem,
  onPrimaryAction,
  onAddFocus,
}) => {
  const priorityConfig = {
    high: { icon: '◆', color: 'text-red-400', border: 'border-red-500/60', bg: 'bg-red-950/30' },
    medium: { icon: '◇', color: 'text-yellow-400', border: 'border-yellow-500/60', bg: 'bg-yellow-950/30' },
    low: { icon: '○', color: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-950/60' },
  };

  const [isPressed, setIsPressed] = useState(false);

  if (!focusItem) {
    return (
      <div className="bg-slate-950/60 border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors cursor-pointer">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-2xl">◇</span>
          </div>
          <p className="text-slate-100 font-medium mb-1">All clear!</p>
          <p className="text-slate-400 text-sm mb-4">Nothing urgent today</p>
          <button
            onClick={onAddFocus}
            className="px-4 py-2 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            + Add Focus
          </button>
        </div>
      </div>
    );
  }

  const config = priorityConfig[focusItem.priority];

  return (
    <div
      className={`bg-slate-950/60 border-l-4 ${config.border} rounded-lg p-5 hover:shadow-lg hover:shadow-slate-900/50 transition-all cursor-pointer`}
      onClick={() => focusItem && onPrimaryAction?.(focusItem)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{ transform: isPressed ? 'scale(0.98)' : 'scale(1)' }}
    >
      {/* Header with priority */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${config.color}`}>{config.icon}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            {focusItem.priority === 'high' ? 'Priority' : focusItem.priority}
          </span>
        </div>
        {focusItem.category && (
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
            {focusItem.category}
          </span>
        )}
      </div>

      {/* Focus title */}
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        {focusItem.title}
      </h3>

      {/* Subtitle if exists */}
      {focusItem.subtitle && (
        <p className="text-sm text-slate-400 mb-4">{focusItem.subtitle}</p>
      )}

      {/* Action button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          focusItem && onPrimaryAction?.(focusItem);
        }}
        className="w-full py-3 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
      >
        <span>{focusItem.actionLabel}</span>
        <span className="text-lg">→</span>
      </button>
    </div>
  );
};

export default TodaysFocus;
