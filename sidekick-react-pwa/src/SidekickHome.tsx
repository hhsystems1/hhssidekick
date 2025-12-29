import React, { useEffect, useState } from 'react';

export const SidekickHome: React.FC = () => {
  const [captureText, setCaptureText] = useState('');
  const [captureStatus, setCaptureStatus] = useState('Nothing saved yet.');
  const [todayLabel, setTodayLabel] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    setTodayLabel(formatted);
  }, []);

  const handleSave = () => {
    const trimmed = captureText.trim();
    if (!trimmed) {
      setCaptureStatus('Nothing to save yet.');
      return;
    }
    setCaptureStatus('Saved to Sidekick inbox (demo only).');
  };

  const handleClear = () => {
    setCaptureText('');
    setCaptureStatus('Cleared. Nothing saved yet.');
  };

  return (
    <div className="min-h-full bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-4 md:px-6">
        {/* Top bar */}
        <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex flex-col gap-0.5">
            <div className="text-lg font-semibold tracking-wide">
              Sidekick <span className="text-emerald-400">Home</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Daily control center for Helping Hands Systems
            </div>
          </div>
          <nav className="flex gap-1 text-[11px]">
            <button className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-100">
              Today
            </button>
            <button className="cursor-not-allowed rounded-full border border-transparent px-3 py-1 text-slate-500 opacity-40">
              Agents
            </button>
            <button className="cursor-not-allowed rounded-full border border-transparent px-3 py-1 text-slate-500 opacity-40">
              Workflows
            </button>
            <button className="cursor-not-allowed rounded-full border border-transparent px-3 py-1 text-slate-500 opacity-40">
              Brain
            </button>
            <button className="cursor-not-allowed rounded-full border border-transparent px-3 py-1 text-slate-500 opacity-40">
              Analytics
            </button>
          </nav>
        </header>

        <p className="mb-4 text-xs text-slate-400">
          Snapshot of today: what matters, what your agents are doing, and a place to dump
          thoughts so nothing gets lost.
        </p>

        {/* Main layout */}
        <div className="grid gap-3 md:grid-cols-[1.6fr,1.4fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-3">
            {/* Priority Focus */}
            <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h2 className="text-[13px] font-semibold">Priority focus</h2>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                  {todayLabel || 'Today'}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Three things that would actually move the needle if you got them done.
              </p>
              <ul className="mt-1 divide-y divide-slate-800 text-[12px]">
                <li className="flex items-baseline justify-between gap-3 py-2">
                  <div>
                    <div className="text-[12px]">
                      Review new residential solar leads
                    </div>
                    <div className="text-[11px] text-slate-400">
                      From: Facebook &amp; Clean Energy Experts
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-emerald-500/60 px-2 py-0.5 text-[10px] text-emerald-400">
                    Needs decision
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-3 py-2">
                  <div>
                    <div className="text-[12px]">
                      Check agent calls + appointment calendar
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Make sure follow-ups are covered
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                    15–20 min
                  </span>
                </li>
                <li className="flex items-baseline justify-between gap-3 py-2">
                  <div>
                    <div className="text-[12px]">
                      Outline one content asset (solar or health)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Keeps traffic and awareness compounding
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                    Deep work
                  </span>
                </li>
              </ul>
            </section>

            {/* Quick Capture */}
            <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h2 className="text-[13px] font-semibold">Quick capture</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Sidekick inbox
                </span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Drop ideas, tasks, or notes here. Sidekick will categorize them later into
                projects, workflows, or content.
              </p>

              <div className="flex flex-col gap-2">
                <textarea
                  className="min-h-[72px] max-h-[140px] w-full resize-y rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[12px] text-slate-100 outline-none focus:border-emerald-400"
                  placeholder="Example: 'Remind me to test new PPA ad in Colorado and send Jo the numbers'"
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-full border border-emerald-500 bg-emerald-700 px-3 py-1.5 text-[11px] font-medium text-emerald-50 hover:bg-emerald-600"
                  >
                    Save to inbox
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 hover:border-slate-500"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">{captureStatus}</div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3">
            {/* Agent Activity */}
            <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h2 className="text-[13px] font-semibold">Agent activity</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Status: demo data
                </span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Last few things your AI agents handled or queued.
              </p>

              <ul className="mt-1 space-y-2 text-[12px]">
                <li className="border-t border-slate-800 pt-2 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div>Sales agent called 5 new solar leads</div>
                      <div className="text-[11px] text-slate-400">
                        Source: Clean Energy Experts → inbound call workflow
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-[10px] text-slate-400">
                      2 min ago
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      appointments: 2 booked
                    </span>
                  </div>
                </li>

                <li className="border-t border-slate-800 pt-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div>Ops agent synced Discord notes to Notion</div>
                      <div className="text-[11px] text-slate-400">
                        Channel: #ideas → Sidekick brain
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-[10px] text-slate-400">
                      18 min ago
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      3 new entries tagged “solar system”
                    </span>
                  </div>
                </li>

                <li className="border-t border-slate-800 pt-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div>Content agent drafted 3 social posts</div>
                      <div className="text-[11px] text-slate-400">
                        Topic: PPA explainer, backup power, payments
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-[10px] text-slate-400">
                      45 min ago
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
                      queued for review
                    </span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Today at a glance */}
            <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h2 className="text-[13px] font-semibold">Today at a glance</h2>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                Quick stats so you don’t have to log into five other tools.
              </p>

              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                <div className="min-w-[90px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <div className="text-[10px] text-slate-400">New leads</div>
                  <div className="text-[13px] font-medium" id="metricLeads">
                    12
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    Residential + commercial
                  </div>
                </div>
                <div className="min-w-[90px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <div className="text-[10px] text-slate-400">Booked calls</div>
                  <div className="text-[13px] font-medium" id="metricCalls">
                    3
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    Next 24–48 hours
                  </div>
                </div>
                <div className="min-w-[90px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <div className="text-[10px] text-slate-400">Agent actions</div>
                  <div className="text-[13px] font-medium" id="metricActions">
                    27
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    Workflows &amp; tasks run
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded-full border border-emerald-500/60 px-2 py-0.5 text-emerald-300">
                  Solar focus
                </span>
                <span className="rounded-full border border-sky-500/60 px-2 py-0.5 text-sky-300">
                  Content queued
                </span>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">
                  Payments &amp; web: light load
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
