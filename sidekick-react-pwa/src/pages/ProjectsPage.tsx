import React, { useEffect, useMemo, useState } from 'react';
import { Plus, FolderKanban, Link as LinkIcon, Rocket } from 'lucide-react';
import { useProjects, useProjectDailyLog, useProjectMemory } from '../hooks/useDatabase';
import { useProjectContext } from '../context/ProjectContext';
import toast from 'react-hot-toast';

export const ProjectsPage: React.FC = () => {
  const { projects, loading, create, update } = useProjects();
  const { activeProjectId, setActiveProjectId } = useProjectContext();
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', repo_url: '', deploy_target: '' });
  const [projectDraft, setProjectDraft] = useState({ name: '', description: '', repo_url: '', deploy_target: '', approvals_required: true });

  const { content: projectMemory, update: updateProjectMemory } = useProjectMemory(activeProjectId || undefined);
  const today = new Date().toISOString().slice(0, 10);
  const {
    summary: dailySummary,
    tasks: dailyTasks,
    audits: dailyAudits,
    update: updateDailyLog,
  } = useProjectDailyLog(activeProjectId || undefined, activeProjectId ? today : undefined);
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );

  useEffect(() => {
    if (!activeProject) {
      setProjectDraft({ name: '', description: '', repo_url: '', deploy_target: '', approvals_required: true });
      return;
    }
    setProjectDraft({
      name: activeProject.name ?? '',
      description: activeProject.description ?? '',
      repo_url: activeProject.repo_url ?? '',
      deploy_target: activeProject.deploy_target ?? '',
      approvals_required: typeof activeProject.approvals_required === 'boolean' ? activeProject.approvals_required : true,
    });
  }, [activeProject]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-slate-400">Your active projects and context.</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-emerald-50 hover:bg-emerald-500"
          >
            <Plus size={16} className="inline-block mr-2" />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className={`text-left rounded-xl p-5 border transition-colors ${
                  activeProjectId === project.id
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderKanban className="text-emerald-400" size={18} />
                  <span className="font-semibold">{project.name}</span>
                </div>
                {project.description && (
                  <p className="text-sm text-slate-400 mt-2">{project.description}</p>
                )}
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                  {project.repo_url && (
                    <span className="inline-flex items-center gap-1">
                      <LinkIcon size={12} /> {project.repo_url}
                    </span>
                  )}
                  {project.deploy_target && (
                    <span className="inline-flex items-center gap-1">
                      <Rocket size={12} /> {project.deploy_target}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {activeProjectId && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-lg font-semibold">Project Context</h2>
              <p className="text-sm text-slate-400 mb-4">Details the agent should always know.</p>
              <div className="space-y-3">
                <input
                  value={projectDraft.name}
                  onChange={(e) => setProjectDraft({ ...projectDraft, name: e.target.value })}
                  placeholder="Project name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={projectDraft.description}
                  onChange={(e) => setProjectDraft({ ...projectDraft, description: e.target.value })}
                  placeholder="Description"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={projectDraft.repo_url}
                  onChange={(e) => setProjectDraft({ ...projectDraft, repo_url: e.target.value })}
                  placeholder="Repo URL"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={projectDraft.deploy_target}
                  onChange={(e) => setProjectDraft({ ...projectDraft, deploy_target: e.target.value })}
                  placeholder="Deploy target (Netlify/Vercel)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={projectDraft.approvals_required}
                    onChange={(e) => setProjectDraft({ ...projectDraft, approvals_required: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Require approvals for writes
                </label>
              </div>
              <div className="mt-4">
                <button
                  onClick={async () => {
                    if (!activeProjectId) return;
                    const ok = await update(activeProjectId, projectDraft);
                    if (ok) {
                      toast.success('Project updated');
                    } else {
                      toast.error('Failed to update project');
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-emerald-50 hover:bg-emerald-500"
                >
                  Save context
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Project Memory</h2>
                <p className="text-sm text-slate-400 mb-3">Stack, goals, constraints, and SOPs for this project.</p>
                <textarea
                  value={projectMemory}
                  onChange={(e) => updateProjectMemory(e.target.value)}
                  className="w-full min-h-[180px] rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold">Today’s Agent Log</h2>
                <p className="text-sm text-slate-400 mb-3">Shared daily tasks and audits for all agents.</p>
                <div className="space-y-3">
                  <textarea
                    value={dailySummary}
                    onChange={(e) => updateDailyLog({ summary: e.target.value })}
                    placeholder="Summary for today…"
                    className="w-full min-h-[70px] rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"
                  />
                  <textarea
                    value={dailyTasks}
                    onChange={(e) => updateDailyLog({ tasks: e.target.value })}
                    placeholder="Tasks for today…"
                    className="w-full min-h-[90px] rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"
                  />
                  <textarea
                    value={dailyAudits}
                    onChange={(e) => updateDailyLog({ audits: e.target.value })}
                    placeholder="Audits / checks completed…"
                    className="w-full min-h-[90px] rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">New Project</h3>
              <div className="space-y-3">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Project name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Description"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={draft.repo_url}
                  onChange={(e) => setDraft({ ...draft, repo_url: e.target.value })}
                  placeholder="Repo URL"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  value={draft.deploy_target}
                  onChange={(e) => setDraft({ ...draft, deploy_target: e.target.value })}
                  placeholder="Deploy target (Netlify/Vercel)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!draft.name.trim()) return;
                    const ok = await create({ ...draft, approvals_required: true });
                    if (ok) {
                      toast.success('Project created');
                      setShowNew(false);
                      setDraft({ name: '', description: '', repo_url: '', deploy_target: '' });
                    } else {
                      toast.error('Failed to create project');
                    }
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-emerald-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
