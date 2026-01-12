/**
 * Integrated Test Page
 * One-stop testing for all functionality
 */

import React, { useState } from 'react';
import { AgentTestPanel } from './components/AgentTestPanel';
import { DatabaseTestPanel } from './components/DatabaseTestPanel';

interface TestPageProps {
  onNavigate?: (view: 'home' | 'chat' | 'test') => void;
}

export const TestPage: React.FC<TestPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'database'>('agent');

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => onNavigate?.('home')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
              aria-label="Back to home"
              title="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">System Tests</h1>
              <p className="text-slate-400 mt-1">Test all integrations in your browser</p>
            </div>
          </div>

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
