/**
 * Integrated Test Page
 * One-stop testing for all functionality
 */

import React, { useState } from 'react';
import { AgentTestPanel } from './components/AgentTestPanel';
import { DatabaseTestPanel } from './components/DatabaseTestPanel';

export const TestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agent' | 'database'>('agent');

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">System Tests</h1>
          <p className="text-slate-400 mb-8">Test all integrations in your browser</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'agent'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              🤖 Agent System
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'database'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              🗄️ Database
            </button>
          </div>

          {/* Content */}
          {activeTab === 'agent' && <AgentTestPanel />}
          {activeTab === 'database' && <DatabaseTestPanel />}
        </div>
      </div>
    </div>
  );
};
