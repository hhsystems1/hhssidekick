import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Palette, HelpCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useUserProfile, useUserSettings } from '../../hooks/useDatabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { EditProfileDialog } from '../../components/EditProfileDialog';
import { ChangePasswordDialog } from '../../components/ChangePasswordDialog';
import { SessionManagementDialog } from '../../components/SessionManagementDialog';
import { DataPrivacyDialog } from '../../components/DataPrivacyDialog';

interface SettingsItem {
  label: string;
  description?: string;
  toggle?: boolean;
  value?: string;
  onClick?: () => void;
}

interface SettingsSection {
  title: string;
  icon: React.ElementType;
  items: SettingsItem[];
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings();

  const [localSettings, setLocalSettings] = useState(settings);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSessionManagement, setShowSessionManagement] = useState(false);
  const [showDataPrivacy, setShowDataPrivacy] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const loading = profileLoading || settingsLoading;

  const handleToggle = async (key: string, value: boolean) => {
    setLocalSettings((prev: typeof settings) => ({ ...prev, [key]: value }));
    const success = await updateSettings({ [key]: value });
    if (success) {
      toast.success('Setting updated');
    } else {
      toast.error('Failed to update setting');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account',
      icon: User,
      items: [
        { 
          label: 'Profile', 
          description: 'Update your name, photo, and timezone',
          value: profile?.full_name || 'Not set',
          onClick: () => setShowEditProfile(true)
        },
        { 
          label: 'Password', 
          description: 'Change your password',
          onClick: () => setShowChangePassword(true)
        },
        { label: 'Connected Accounts', description: 'Manage integrations', onClick: () => toast('Connected accounts coming soon') },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { 
          label: 'Push Notifications', 
          description: 'Receive on your device', 
          toggle: localSettings.push_notifications,
          onClick: () => handleToggle('push_notifications', !localSettings.push_notifications)
        },
        { 
          label: 'Email Notifications', 
          description: 'Receive via email', 
          toggle: localSettings.email_notifications,
          onClick: () => handleToggle('email_notifications', !localSettings.email_notifications)
        },
        { 
          label: 'Task Reminders', 
          description: 'Get reminded about tasks', 
          toggle: localSettings.task_reminders,
          onClick: () => handleToggle('task_reminders', !localSettings.task_reminders)
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { 
          label: 'Two-Factor Authentication', 
          description: 'Add extra security', 
          toggle: localSettings.two_factor_enabled,
          onClick: () => handleToggle('two_factor_enabled', !localSettings.two_factor_enabled)
        },
        { label: 'Session Management', description: 'View active sessions', onClick: () => setShowSessionManagement(true) },
        { label: 'Data & Privacy', description: 'Control your data', onClick: () => setShowDataPrivacy(true) },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { 
          label: 'Theme', 
          description: 'Choose your theme', 
          value: localSettings.theme === 'dark' ? 'Dark' : localSettings.theme === 'light' ? 'Light' : 'System'
        },
        { 
          label: 'Language', 
          description: 'Select language', 
          value: localSettings.language === 'en' ? 'English' : localSettings.language 
        },
        { 
          label: 'Font Size', 
          description: 'Adjust text size', 
          value: localSettings.font_size === 'small' ? 'Small' : localSettings.font_size === 'medium' ? 'Medium' : 'Large'
        },
      ],
    },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Mobile Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="lg:hidden mb-4 flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">Back</span>
      </button>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-100 mb-1">Settings</h1>
        <p className="text-sm text-slate-500">Manage your account preferences</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {settingsSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon size={18} className="text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    {section.title}
                  </h2>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                  {section.items.map((item, itemIndex) => {
                    const hasToggle = item.toggle !== undefined;
                    const hasValue = item.value !== undefined;

                    return (
                      <button
                        key={itemIndex}
                        onClick={item.onClick}
                        className={`w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer text-left ${
                          itemIndex !== section.items.length - 1 ? 'border-b border-slate-800' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-200">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {hasValue && (
                            <span className="text-sm text-slate-400">{item.value}</span>
                          )}
                          {hasToggle && (
                            <div
                              className={`w-11 h-6 rounded-full transition-colors ${
                                item.toggle ? 'bg-emerald-600' : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${
                                  item.toggle ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </div>
                          )}
                          {!hasToggle && !hasValue && (
                            <span className="text-slate-500">→</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={18} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Help & Support
              </h2>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toast('Help Center coming soon')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer text-left border-b border-slate-800"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">Help Center</p>
                  <p className="text-xs text-slate-500 mt-0.5">Get help with using Sidekick</p>
                </div>
                <span className="text-slate-500">→</span>
              </button>
              <button
                onClick={() => toast('Contact Support coming soon')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">Contact Support</p>
                  <p className="text-xs text-slate-500 mt-0.5">Get help from our team</p>
                </div>
                <span className="text-slate-500">→</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="w-full py-3 border border-red-900/60 text-red-400 rounded-xl hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}

      {/* Dialogs */}
      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <SessionManagementDialog
        isOpen={showSessionManagement}
        onClose={() => setShowSessionManagement(false)}
      />

      <DataPrivacyDialog
        isOpen={showDataPrivacy}
        onClose={() => setShowDataPrivacy(false)}
      />
    </div>
  );
};

export default SettingsPage;
