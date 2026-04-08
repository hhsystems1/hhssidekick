import React, { useState } from 'react';
import { X, Download, Trash2, Shield, Eye, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DataPrivacyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  itemCount: number;
}

export const DataPrivacyDialog: React.FC<DataPrivacyDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock data categories - in production, fetch from API
  const [dataCategories] = useState<DataCategory[]>([
    { id: 'tasks', name: 'Tasks', description: 'Your tasks and todos', itemCount: 24 },
    { id: 'conversations', name: 'Conversations', description: 'Chat history with AI', itemCount: 156 },
    { id: 'agents', name: 'Agents', description: 'Deployed AI agents', itemCount: 3 },
    { id: 'calendar', name: 'Calendar', description: 'Scheduled events', itemCount: 12 },
  ]);

  const handleExportData = async (categoryId: string) => {
    setLoading(categoryId);
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    setLoading('all');
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('All data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteData = async () => {
    setLoading('delete');
    try {
      // Simulate delete delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Data deleted successfully');
      setShowDeleteConfirm(false);
    } catch {
      toast.error('Failed to delete data');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="app-backdrop absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="bg-app-panel border-app relative mx-4 flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-app flex shrink-0 items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-app text-lg font-semibold">Data & Privacy</h3>
              <p className="text-app-soft text-xs">Control your data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover-bg-app rounded-full p-2 transition-colors"
          >
            <X size={20} className="text-app-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h4 className="text-app-muted mb-3 flex items-center gap-2 text-sm font-medium">
              <Download size={16} className="text-app-muted" />
              Export Your Data
            </h4>
            <div className="space-y-2">
              {dataCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-app-panel-soft border-app flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-app-soft" />
                    <div>
                      <p className="text-app text-sm">{category.name}</p>
                      <p className="text-app-soft text-xs">{category.itemCount} items</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportData(category.id)}
                    disabled={loading !== null}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1 hover:bg-emerald-950/30 rounded"
                  >
                    {loading === category.id ? 'Exporting...' : 'Export'}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleExportAll}
              disabled={loading !== null}
              className="bg-app-muted text-app mt-3 w-full rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 hover:bg-slate-700"
            >
              {loading === 'all' ? 'Exporting...' : 'Export All Data'}
            </button>
          </div>

          <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 flex items-start gap-3">
            <Eye size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-200 font-medium">What we collect</p>
              <p className="text-xs text-blue-400 mt-0.5">
                We collect only the data necessary to provide our services. This includes your tasks,
                conversations, and agent configurations. We never sell your data.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
              <Trash2 size={16} />
              Delete Your Data
            </h4>
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3">
              <p className="text-app-muted mb-3 text-xs">
                Permanently delete all your data. This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 bg-red-900/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/50 transition-colors border border-red-800"
                >
                  Delete All Data
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-300 font-medium flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-app-muted text-app-muted flex-1 rounded-lg py-2 text-sm font-medium transition-colors hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteData}
                      disabled={loading !== null}
                      className="flex-1 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {loading === 'delete' ? 'Deleting...' : 'Delete All'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPrivacyDialog;
