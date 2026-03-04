import React, { useMemo } from 'react';
import { Activity, Calendar, CheckCircle2, Lock, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgents, useCalendarEvents, useTasks } from '../hooks/useDatabase';

const AUTHORIZED_EMAILS = [
  'helpingshandsystems1@gmail.com',
  'brendon1798@gmail.com',
  'info@hhsystems.org',
];

const cronJobs = [
  {
    id: 'mem-warm',
    label: 'Memory Warm',
    owner: 'Data Ops',
    status: 'On schedule',
    nextRun: 'in 12m',
    priority: 'high',
  },
  {
    id: 'mem-curate',
    label: 'Memory Curate',
    owner: 'Signal',
    status: 'Awaiting approval',
    nextRun: 'Today · 14:00',
    priority: 'medium',
  },
  {
    id: 'render-sync',
    label: 'Render Scheduler',
    owner: 'Render Ops',
    status: 'Healthy',
    nextRun: 'in 48m',
    priority: 'low',
  },
];

const projectHighlights = [
  {
    name: 'Mission Control CRM',
    lead: 'Ops Command',
    trend: 'Reflowing agent workflows',
    progress: 74,
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    name: 'Agent Approvals Runbook',
    lead: 'Signal Team',
    trend: 'Locking gating + QA',
    progress: 58,
    accent: 'from-indigo-500 to-indigo-600',
  },
  {
    name: 'Automation Projects',
    lead: 'Field Crew',
    trend: 'Scheduling cron + render jobs',
    progress: 46,
    accent: 'from-rose-500 to-rose-600',
  },
];

export const MissionControlDashboard: React.FC = () => {
  const { user } = useAuth();
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { events } = useCalendarEvents();

  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const pendingTasks = tasks.filter(task => !task.completed);
  const authorizedEmail = user?.email?.toLowerCase();
  const isAuthorized = !!authorizedEmail && AUTHORIZED_EMAILS.includes(authorizedEmail);

  const approvals = useMemo(() => {
    const base = pendingTasks.slice(0, 4);
    return base.map((task, index) => ({
      id: task.id,
      title: task.title,
      requester: index % 2 === 0 ? 'Ops Commander' : 'Field Lead',
      due: `${index + 1}h window`,
      status: index === 0 ? 'Ready for review' : 'Needs stakeholder sign-off',
    }));
  }, [pendingTasks]);

  const activity = useMemo(() => {
    const calendarUpdates = events.slice(0, 3).map(event => ({
      id: event.id,
      label: event.title,
      detail: `Calendar · ${event.startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
      timestamp: event.startTime.getTime(),
    }));

    const taskUpdates = pendingTasks.slice(0, 3).map(task => ({
      id: task.id,
      label: task.title,
      detail: `Task · ${task.priority} priority`,
      timestamp: Date.now() - Math.random() * 1000000,
    }));

    const cronUpdates = cronJobs.map(cron => ({
      id: cron.id,
      label: cron.label,
      detail: `Cron · ${cron.status}`,
      timestamp: Date.now() - Math.random() * 500000,
    }));

    return [...calendarUpdates, ...taskUpdates, ...cronUpdates]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);
  }, [events, pendingTasks]);

  const upcomingEvents = events.slice(0, 3);
  const soonestTasks = pendingTasks.slice(0, 3);

  const allowedList = AUTHORIZED_EMAILS.map(email => (
    <span key={email} className="rounded-full bg-slate-800/60 px-3 py-1 text-[11px] text-slate-300">
      {email}
    </span>
  ));

  const summaryTiles = [
    {
      label: 'Active Agents',
      value: activeAgents,
      helper: 'live supervisors',
      icon: <Sparkles className="text-emerald-400" size={18} />, 
    },
    {
      label: 'Pending Approvals',
      value: approvals.length,
      helper: 'waiting on leads',
      icon: <ShieldCheck className="text-amber-400" size={18} />,
    },
    {
      label: 'Upcoming Crons',
      value: cronJobs.length,
      helper: 'next 24h',
      icon: <Activity className="text-sky-400" size={18} />,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 lg:px-0">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950/95 to-slate-900/80 p-6 shadow-2xl shadow-slate-900/50 backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-500 p-2 text-slate-100 shadow-lg shadow-emerald-950/40">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mission Control</p>
                  <p className="text-lg font-semibold text-slate-100">Secure command card</p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-300"
              >
                <RefreshCw size={12} />
                Refresh session
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              {isAuthorized ? (
                <div className="space-y-1">
                  <p className="text-sm text-emerald-300">Access granted.</p>
                  <p className="text-xs text-slate-400">You are signed in with {user?.email}.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-200">Locked: authorized CRM accounts only.</p>
                  <p className="text-xs text-slate-400">
                    Sign in with one of the approved emails below via the sidebar “Sign In” button.
                  </p>
                  <div className="flex flex-wrap gap-2">{allowedList}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {summaryTiles.map(tile => (
              <div key={tile.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{tile.label}</span>
                  {tile.icon}
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{tile.value}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{tile.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Approvals</p>
                <h3 className="text-lg font-semibold text-slate-100">Who still needs the nod</h3>
              </div>
              <span className="text-[11px] text-emerald-400">{approvals.length} items</span>
            </div>
            <div className="mt-4 space-y-3">
              {approvals.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.requester}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <p>{item.status}</p>
                    <p className="text-slate-500">{item.due}</p>
                  </div>
                </div>
              ))}
              {approvals.length === 0 && (
                <p className="text-xs text-slate-500">No pending approvals—everything is signed off.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cron Jobs</p>
                <h3 className="text-lg font-semibold text-slate-100">Operational cadence</h3>
              </div>
              <span className="text-[11px] text-slate-400">24h radar</span>
            </div>
            <div className="mt-4 space-y-3">
              {cronJobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{job.label}</p>
                    <p className="text-[11px] text-slate-400">{job.owner}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p className="text-emerald-300">{job.status}</p>
                    <p>{job.nextRun}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Projects</p>
                <h3 className="text-lg font-semibold text-slate-100">Current initiatives</h3>
              </div>
              <Sparkles className="text-emerald-400" size={18} />
            </div>
            <div className="mt-4 space-y-4">
              {projectHighlights.map(project => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{project.name}</span>
                    <span>{project.lead}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${project.accent}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    {project.trend} · {project.progress}%
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Activity</p>
                <h3 className="text-lg font-semibold text-slate-100">Pulse log</h3>
              </div>
              <Activity className="text-slate-400" size={18} />
            </div>
            <div className="mt-4 space-y-3">
              {activity.map(entry => (
                <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
                  <div>
                    <p className="text-sm text-slate-100">{entry.label}</p>
                    <p className="text-[11px] text-slate-500">{entry.detail}</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Calendar</p>
              <h3 className="text-lg font-semibold text-slate-100">Live mission slots</h3>
            </div>
            <Calendar className="text-slate-400" size={18} />
          </div>
          <div className="mt-4 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-500">No scheduled events — drop a mission.</p>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">{event.title}</p>
                  <p className="text-[11px] text-slate-500">
                    Starts {event.startTime.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {event.location && (
                    <p className="text-[11px] text-slate-400">Location · {event.location}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tasks</p>
              <h3 className="text-lg font-semibold text-slate-100">Ready to ship</h3>
            </div>
            <CheckCircle2 className="text-slate-400" size={18} />
          </div>
          <div className="mt-4 space-y-3">
            {soonestTasks.length === 0 ? (
              <p className="text-xs text-slate-500">All tasks cleared—great visibility.</p>
            ) : (
              soonestTasks.map(task => (
                <div key={task.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                  <p className="text-[11px] text-slate-500">{task.priority.toUpperCase()} priority</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
};

export default MissionControlDashboard;
