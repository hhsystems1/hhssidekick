/**
 * SkillsPage Component
 * Skills hub placeholder
 */

import React from 'react';
import { Sparkles, Wrench, BookOpen } from 'lucide-react';

export const SkillsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-slate-400">Skills are coming soon. This page will manage reusable workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <Sparkles size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Skill Library</h3>
            <p className="text-sm text-slate-400 mt-2">Browse prebuilt skills and templates.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <Wrench size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Skill Builder</h3>
            <p className="text-sm text-slate-400 mt-2">Create and customize skills for your agents.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <BookOpen size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Docs</h3>
            <p className="text-sm text-slate-400 mt-2">Guides and examples for skill development.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400">We will wire this to your skills catalog soon.</p>
        </div>
      </div>
    </div>
  );
};

export default SkillsPage;
