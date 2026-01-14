import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Palette, HelpCircle, LogOut } from 'lucide-react';
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
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showFontSizeDialog, setShowFontSizeDialog] = useState(false);

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
          value: localSettings.theme === 'dark' ? 'Dark' : localSettings.theme === 'light' ? 'Light' : 'System',
          onClick: () => setShowThemeDialog(true)
        },
        {
          label: 'Language',
          description: 'Select language',
          value: localSettings.language === 'en' ? 'English' : localSettings.language,
          onClick: () => setShowLanguageDialog(true)
        },
        {
          label: 'Font Size',
          description: 'Adjust text size',
          value: localSettings.font_size === 'small' ? 'Small' : localSettings.font_size === 'medium' ? 'Medium' : 'Large',
          onClick: () => setShowFontSizeDialog(true)
        },
      ],
    },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
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

      {/* Theme Dialog */}
      {showThemeDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Choose Theme</h2>
              <div className="space-y-2">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={async () => {
                      await updateSettings({ theme });
                      toast.success(`Theme set to ${theme}`);
                      setShowThemeDialog(false);
                    }}
                    className={`w-full p-4 rounded-lg border transition-colors text-left ${
                      localSettings.theme === theme
                        ? 'border-emerald-600 bg-emerald-950/30'
                        : 'border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-200 capitalize">{theme}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {theme === 'system' ? 'Follow system preference' : `Use ${theme} mode`}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowThemeDialog(false)}
                className="mt-4 w-full py-2 px-4 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Dialog */}
      {showLanguageDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Choose Language</h2>
              <div className="space-y-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'es', name: 'Español' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={async () => {
                      await updateSettings({ language: lang.code });
                      toast.success(`Language set to ${lang.name}`);
                      setShowLanguageDialog(false);
                    }}
                    className={`w-full p-4 rounded-lg border transition-colors text-left ${
                      localSettings.language === lang.code
                        ? 'border-emerald-600 bg-emerald-950/30'
                        : 'border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-200">{lang.name}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowLanguageDialog(false)}
                className="mt-4 w-full py-2 px-4 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Font Size Dialog */}
      {showFontSizeDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Choose Font Size</h2>
              <div className="space-y-2">
                {([
                  { size: 'small' as const, label: 'Small', description: 'Compact text' },
                  { size: 'medium' as const, label: 'Medium', description: 'Default size' },
                  { size: 'large' as const, label: 'Large', description: 'Easier to read' },
                ] as const).map((font) => (
                  <button
                    key={font.size}
                    onClick={async () => {
                      await updateSettings({ font_size: font.size });
                      toast.success(`Font size set to ${font.label}`);
                      setShowFontSizeDialog(false);
                    }}
                    className={`w-full p-4 rounded-lg border transition-colors text-left ${
                      localSettings.font_size === font.size
                        ? 'border-emerald-600 bg-emerald-950/30'
                        : 'border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-200">{font.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{font.description}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFontSizeDialog(false)}
                className="mt-4 w-full py-2 px-4 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
