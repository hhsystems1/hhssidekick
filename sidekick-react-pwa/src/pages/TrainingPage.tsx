/**
 * TrainingPage Component
 * Knowledge base and training management page
 */

import React, { useState } from 'react';
import { BookOpen, Upload, FileText, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'text' | 'url';
  size?: string;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
}

export const TrainingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Mock data - replace with actual database calls
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Sales Playbook 2024',
      type: 'pdf',
      size: '2.4 MB',
      uploadedAt: '2024-01-10',
      status: 'ready',
    },
    {
      id: '2',
      title: 'Product Documentation',
      type: 'url',
      uploadedAt: '2024-01-08',
      status: 'ready',
    },
    {
      id: '3',
      title: 'Customer Success Guide',
      type: 'text',
      size: '156 KB',
      uploadedAt: '2024-01-05',
      status: 'processing',
    },
  ]);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const loadingToast = toast.loading('Deleting document...');
    // Simulate API call
    setTimeout(() => {
      setDocuments(documents.filter(d => d.id !== docId));
      toast.success('Document deleted successfully!', { id: loadingToast });
    }, 500);
  };

  const handleUpload = () => {
    toast.success('Document uploaded successfully! Processing...');
    setShowUploadDialog(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'url':
        return '🔗';
      case 'text':
        return '📝';
      default:
        return '📄';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <span className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Ready</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">Processing</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/40">Error</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Training & Knowledge Base</h1>
          <p className="text-slate-400">Upload and manage documents to train your AI agents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Total Documents</p>
            <p className="text-3xl font-semibold">{documents.length}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Ready</p>
            <p className="text-3xl font-semibold text-emerald-400">
              {documents.filter(d => d.status === 'ready').length}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Processing</p>
            <p className="text-3xl font-semibold text-yellow-400">
              {documents.filter(d => d.status === 'processing').length}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Total Size</p>
            <p className="text-3xl font-semibold">2.5 MB</p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap"
          >
            <Upload size={20} />
            Upload Document
          </button>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-400 mb-4">
              {searchQuery ? 'No documents found' : 'No documents uploaded yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowUploadDialog(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                Upload Your First Document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{getTypeIcon(doc.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{doc.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        {doc.size && <span>{doc.size}</span>}
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast('View document coming soon!')}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
                      aria-label="View document"
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                      aria-label="Delete document"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Upload Document</h3>
              <button
                onClick={() => setShowUploadDialog(false)}
                className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-600 transition-colors cursor-pointer">
                <Upload className="mx-auto mb-3 text-slate-400" size={32} />
                <p className="text-slate-300 mb-1">Drop files here or click to browse</p>
                <p className="text-sm text-slate-500">PDF, TXT, DOCX up to 10MB</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadDialog(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
