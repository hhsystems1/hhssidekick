import React, { useState, useEffect } from 'react';
import { Menu, ChevronRight, Play, Pause, Plus, CheckCircle, Circle } from 'lucide-react';

interface SidekickHomeProps {
  onNavigate?: (view: 'home' | 'chat') => void;
}

export const SidekickHome: React.FC<SidekickHomeProps> = ({ onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setTodayLabel(formatted);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold text-slate-100">Sidekick</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem icon="🏠" label="Dashboard" active onClick={() => {}} />
            <NavItem icon="💬" label="Chat" onClick={() => onNavigate?.('chat')} />
            <NavItem icon="🤖" label="Agents" onClick={() => {}} />
            <NavItem icon="📚" label="Training" onClick={() => {}} />
            <NavItem icon="🛒" label="Marketplace" onClick={() => {}} />
            <NavItem icon="👤" label="Profile" onClick={() => {}} />
          </nav>

          {/* Bottom action */}
          <div className="p-4 border-t border-slate-800">
            <button className="w-full py-3 px-4 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors">
              New Brain Dump
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-slate-950/60 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-100"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold text-slate-100">Dashboard</h2>
          <div className="w-10 h-10 rounded-full bg-slate-700" />
        </div>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Today's Tasks</h3>
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-100">
                  <Plus size={20} />
                </button>
              </div>

              <TaskCard
                title="Launch Victoria Commercial Outreach"
                completed={false}
                priority="high"
              />
              <TaskCard
                title="Review AZ Quiz Funnel Performance"
                completed={true}
                priority="medium"
              />
              <TaskCard
                title="Update Solar PPA Lead Script"
                completed={false}
                priority="low"
              />

              <div className="pt-4">
                <p className="text-sm text-slate-500">3 of 8 tasks complete</p>
              </div>
            </div>

            {/* Column 2: Calendar/Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Schedule</h3>
                <span className="text-sm text-slate-500">{todayLabel}</span>
              </div>

              <CalendarEvent
                time="9:00 AM"
                title="Team Standup"
                attendees={["Jo", "Brendon"]}
              />
              <CalendarEvent
                time="2:00 PM"
                title="Jeromy - AZ Market Review"
                attendees={["Jeromy"]}
              />

              <div className="bg-slate-900/60 rounded-xl p-6 mt-6 border border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Next up</p>
                <p className="font-medium text-slate-100">Team Standup</p>
                <p className="text-sm text-slate-500 mt-1">in 45 minutes</p>
              </div>
            </div>

            {/* Column 3: Agent Activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Agents</h3>
                <button className="text-sm text-slate-400 hover:text-slate-100">
                  View all
                </button>
              </div>

              <AgentCard
                name="Lead Gen Bot"
                status="active"
                metric="12 leads today"
              />
              <AgentCard
                name="Follow-up Automator"
                status="idle"
                metric="Last run: 2h ago"
              />
              <AgentCard
                name="Email Qualifier"
                status="active"
                metric="8 emails processed"
              />

              <button className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors font-medium">
                + Deploy New Agent
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
            <StatCard label="Active Campaigns" value="3" />
            <StatCard label="Leads This Week" value="47" />
            <StatCard label="SOPs Created" value="12" />
            <StatCard label="Training Complete" value="68%" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Components
function NavItem({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-slate-950/60 border border-slate-800' : 'hover:bg-slate-800'}`}>
      <span className="text-xl">{icon}</span>
      <span className={`font-medium ${active ? 'text-slate-100' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

function TaskCard({ title, completed, priority }: { title: string; completed: boolean; priority: 'high' | 'medium' | 'low' }) {
  const priorityColors = {
    high: 'border-red-500/60 bg-red-950/30',
    medium: 'border-yellow-500/60 bg-yellow-950/30',
    low: 'border-slate-700 bg-slate-950/60'
  };

  return (
    <div className={`border-l-4 ${priorityColors[priority]} rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow cursor-pointer border border-slate-800`}>
      <div className="flex items-start space-x-3">
        {completed ? (
          <CheckCircle size={20} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        ) : (
          <Circle size={20} className="text-slate-500 mt-0.5 flex-shrink-0" />
        )}
        <span className={`${completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
          {title}
        </span>
      </div>
    </div>
  );
}

function CalendarEvent({ time, title, attendees }: { time: string; title: string; attendees: string[] }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{time}</p>
          <p className="font-medium text-slate-100">{title}</p>
          <div className="flex items-center space-x-1 mt-2">
            {attendees.map((name, i) => (
              <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{name}</span>
            ))}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-500 mt-1" />
      </div>
    </div>
  );
}

function AgentCard({ name, status, metric }: { name: string; status: 'active' | 'idle'; metric: string }) {
  const isActive = status === 'active';

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className="font-medium text-slate-100">{name}</span>
        </div>
        <button className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100">
          {isActive ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      <p className="text-sm text-slate-400">{metric}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
