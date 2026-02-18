/**
 * FilesPage Component
 * File hub placeholder
 */

import React from 'react';
import { FolderOpen, UploadCloud, FileText } from 'lucide-react';

export const FilesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-slate-400">Manage project files and uploads.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <FolderOpen size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Browse Files</h3>
            <p className="text-sm text-slate-400 mt-2">See all stored files in one place.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <UploadCloud size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Upload</h3>
            <p className="text-sm text-slate-400 mt-2">Add new files for agents and training.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <FileText size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Recent Files</h3>
            <p className="text-sm text-slate-400 mt-2">Quick access to what you used recently.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400">Files management will be connected to storage next.</p>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
