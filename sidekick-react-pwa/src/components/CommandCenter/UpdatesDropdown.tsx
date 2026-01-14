/**
 * UpdatesDropdown Component
 * Dropdown for notifications and updates
 */

import React, { useState, useRef, useEffect } from 'react';
import type { UpdateItem } from './CommandCenter.types';
import { X, Bell, Clock } from 'lucide-react';

interface UpdatesDropdownProps {
  updates?: UpdateItem[];
  isOpen?: boolean;
  onClose?: () => void;
  onItemClick?: (item: UpdateItem) => void;
  onMarkAllRead?: () => void;
}

export const UpdatesDropdown: React.FC<UpdatesDropdownProps> = ({
  updates = [],
  isOpen = false,
  onClose,
  onItemClick,
  onMarkAllRead,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localUpdates, setLocalUpdates] = useState(updates);

  useEffect(() => {
    setLocalUpdates(updates);
  }, [updates]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const unreadCount = localUpdates.filter(u => !u.isRead).length;

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const categoryConfig = {
    team: { icon: '●', color: 'text-emerald-400' },
    deadline: { icon: '!', color: 'text-orange-400' },
    resource: { icon: '◆', color: 'text-blue-400' },
    mention: { icon: '@', color: 'text-purple-400' },
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-slate-400" />
          <span className="font-semibold text-slate-100">Updates</span>
          {unreadCount > 0 && (
            <span className="bg-emerald-700 text-emerald-50 text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Updates list */}
      <div className="max-h-96 overflow-y-auto">
        {localUpdates.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400 text-sm">No updates yet</p>
          </div>
        ) : (
          localUpdates.map((update) => {
            const config = categoryConfig[update.category];
            return (
              <div
                key={update.id}
                onClick={() => onItemClick?.(update)}
                className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                  !update.isRead ? 'bg-slate-800/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${update.category === 'team' ? 'bg-emerald-950/50' : update.category === 'deadline' ? 'bg-orange-950/50' : update.category === 'resource' ? 'bg-blue-950/50' : 'bg-purple-950/50'}`}>
                    <span className={`text-sm ${config.color}`}>{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${update.isRead ? 'text-slate-400' : 'text-slate-100'}`}>
                      {update.title}
                    </p>
                    {update.subtitle && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{update.subtitle}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-slate-500" />
                      <span className="text-xs text-slate-500">{formatRelativeTime(update.timestamp)}</span>
                    </div>
                  </div>
                  {!update.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpdatesDropdown;
