/**
 * ProfilePage Component
 * User profile and settings management
 */

import React, { useState } from 'react';
import { User, Mail, Phone, Building, MapPin, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock user data
  const [profile, setProfile] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Helping Hands Systems',
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    bio: 'AI enthusiast and automation expert',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    agentAlerts: true,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    const loadingToast = toast.loading('Saving profile...');

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setIsEditing(false);
      toast.success('Profile updated successfully!', { id: loadingToast });
    }, 1000);
  };

  const handleSaveSettings = async () => {
    const loadingToast = toast.loading('Saving settings...');

    // Simulate API call
    setTimeout(() => {
      toast.success('Settings updated successfully!', { id: loadingToast });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile & Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-3xl">
                  👤
                </div>
                {isEditing && (
                  <button
                    onClick={() => toast('Upload photo coming soon!')}
                    className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white hover:bg-emerald-500 transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <p className="text-slate-400">{profile.email}</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <Building size={16} className="inline mr-2" />
                  Company
                </label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Timezone
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/New_York">Eastern Time</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-2">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>

            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Get browser push notifications' },
                { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive weekly summary emails' },
                { key: 'agentAlerts', label: 'Agent Alerts', description: 'Get notified when agents need attention' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-b-0">
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-sm text-slate-400">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[setting.key as keyof typeof settings]}
                      onChange={(e) => {
                        setSettings({ ...settings, [setting.key]: e.target.checked });
                        handleSaveSettings();
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h2>
            <div className="space-y-3">
              <button
                onClick={() => toast('Export data coming soon!')}
                className="w-full px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:border-slate-600 hover:text-slate-100 transition-colors text-left"
              >
                Export Your Data
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    toast.error('Account deletion is not available in demo mode');
                  }
                }}
                className="w-full px-4 py-2 border border-red-900 rounded-lg text-red-400 hover:bg-red-950/50 transition-colors text-left"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
