/**
 * DeployAgentDialog Component
 * Form to deploy a new agent with configuration
 */

import React, { useState } from 'react';
import { X, Bot, Zap, Cog, Code, Sparkles } from 'lucide-react';

interface DeployAgentDialogProps {
  onClose: () => void;
  onSubmit: (name: string, agentType: string) => Promise<boolean>;
}

const AGENT_TYPES = [
  {
    type: 'reflection',
    name: 'Reflection Agent',
    icon: Sparkles,
    description: 'General thinking partner for clarity and exploration',
    color: 'text-purple-400'
  },
  {
    type: 'strategy',
    name: 'Strategy Agent',
    icon: Zap,
    description: 'Business strategy, leverage, and decision analysis',
    color: 'text-blue-400'
  },
  {
    type: 'systems',
    name: 'Systems Agent',
    icon: Cog,
    description: 'Workflow design, automation, and process optimization',
    color: 'text-emerald-400'
  },
  {
    type: 'technical',
    name: 'Technical Agent',
    icon: Code,
    description: 'Software architecture, implementation, and debugging',
    color: 'text-orange-400'
  },
  {
    type: 'creative',
    name: 'Creative Agent',
    icon: Bot,
    description: 'Messaging, content, and communication strategy',
    color: 'text-pink-400'
  }
];

export const DeployAgentDialog: React.FC<DeployAgentDialogProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedType) return;

    setSubmitting(true);
    const success = await onSubmit(name, selectedType);
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-100">Deploy New Agent</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Agent Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lead Gen Bot"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Agent Type
            </label>
            <div className="grid grid-cols-1 gap-3">
              {AGENT_TYPES.map((agent) => {
                const Icon = agent.icon;
                return (
                  <button
                    key={agent.type}
                    type="button"
                    onClick={() => setSelectedType(agent.type)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedType === agent.type
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`${agent.color} mt-1 flex-shrink-0`} size={24} />
                      <div>
                        <div className="font-semibold text-slate-100 mb-1">{agent.name}</div>
                        <div className="text-sm text-slate-400">{agent.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !selectedType || submitting}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Deploying...' : 'Deploy Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
