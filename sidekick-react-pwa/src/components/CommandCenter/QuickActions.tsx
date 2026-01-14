/**
 * QuickActions Component
 * Quick action buttons for common tasks
 */

import React from 'react';

export interface QuickAction {
  id: string;
  type: 'task' | 'meeting' | 'message';
  label: string;
  icon: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onActionPress?: (action: QuickAction) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = [
    { id: 'task', type: 'task', label: '+ Task', icon: '+' },
    { id: 'meeting', type: 'meeting', label: 'Meet', icon: '◎' },
    { id: 'message', type: 'message', label: 'Msg', icon: '○' },
  ],
  onActionPress,
}) => {
  const actionConfig = {
    task: { icon: '+', color: 'text-emerald-400', border: 'border-emerald-500/60' },
    meeting: { icon: '◎', color: 'text-blue-400', border: 'border-blue-500/60' },
    message: { icon: '○', color: 'text-purple-400', border: 'border-purple-500/60' },
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => {
        const config = actionConfig[action.type];
        return (
          <button
            key={action.id}
            onClick={() => onActionPress?.(action)}
            className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-950/80 transition-all active:scale-95 flex flex-col items-center gap-2"
          >
            <div className={`w-10 h-10 rounded-full border ${config.border} flex items-center justify-center ${config.color}`}>
              <span className="text-lg">{config.icon}</span>
            </div>
            <span className="text-sm text-slate-300 font-medium">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
