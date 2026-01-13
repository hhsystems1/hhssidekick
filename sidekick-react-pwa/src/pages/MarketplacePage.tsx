/**
 * MarketplacePage Component
 * Browse and install agent templates, integrations, and tools
 */

import React, { useState } from 'react';
import { Search, Star, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: 'agent' | 'integration' | 'tool';
  rating: number;
  downloads: number;
  icon: string;
  price: number;
  installed?: boolean;
}

export const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'agent' | 'integration' | 'tool'>('all');

  // Mock data - replace with actual API calls
  const [items, setItems] = useState<MarketplaceItem[]>([
    {
      id: '1',
      name: 'Lead Generation Bot',
      description: 'Automatically find and qualify leads from multiple sources',
      category: 'agent',
      rating: 4.8,
      downloads: 1234,
      icon: '🎯',
      price: 0,
      installed: false,
    },
    {
      id: '2',
      name: 'Slack Integration',
      description: 'Connect your agents to Slack for real-time notifications',
      category: 'integration',
      rating: 4.6,
      downloads: 2156,
      icon: '💬',
      price: 0,
      installed: true,
    },
    {
      id: '3',
      name: 'Email Automation Suite',
      description: 'Automated email campaigns with AI-powered personalization',
      category: 'tool',
      rating: 4.9,
      downloads: 3421,
      icon: '📧',
      price: 29.99,
      installed: false,
    },
    {
      id: '4',
      name: 'Sales Assistant Agent',
      description: 'AI agent that helps close deals and manage your pipeline',
      category: 'agent',
      rating: 4.7,
      downloads: 987,
      icon: '💼',
      price: 0,
      installed: false,
    },
    {
      id: '5',
      name: 'CRM Connector',
      description: 'Sync your data with popular CRM platforms',
      category: 'integration',
      rating: 4.5,
      downloads: 1876,
      icon: '🔗',
      price: 0,
      installed: false,
    },
    {
      id: '6',
      name: 'Analytics Dashboard',
      description: 'Advanced analytics and reporting tools for your agents',
      category: 'tool',
      rating: 4.8,
      downloads: 1543,
      icon: '📊',
      price: 49.99,
      installed: false,
    },
  ]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const loadingToast = toast.loading(`Installing ${item.name}...`);

    // Simulate installation
    setTimeout(() => {
      setItems(items.map(i =>
        i.id === itemId ? { ...i, installed: true } : i
      ));
      toast.success(`${item.name} installed successfully!`, { id: loadingToast });
    }, 1500);
  };

  const categories = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'agent', label: 'Agents', count: items.filter(i => i.category === 'agent').length },
    { id: 'integration', label: 'Integrations', count: items.filter(i => i.category === 'integration').length },
    { id: 'tool', label: 'Tools', count: items.filter(i => i.category === 'tool').length },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-slate-400">Discover and install agents, integrations, and tools</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No items found matching your search
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{item.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-500">{item.downloads.toLocaleString()} downloads</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {item.price === 0 ? 'Free' : `$${item.price}`}
                  </span>
                </div>

                <button
                  onClick={() => item.installed ? toast('Already installed!') : handleInstall(item.id)}
                  disabled={item.installed}
                  className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    item.installed
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {item.installed ? (
                    <>
                      <span>✓</span>
                      <span>Installed</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Install</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => toast('Item details coming soon!')}
                  className="w-full mt-2 py-2 border border-slate-700 rounded-lg text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <span>Learn More</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
