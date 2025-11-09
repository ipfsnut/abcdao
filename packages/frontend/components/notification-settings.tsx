/**
 * Notification Settings Component
 * 
 * Allows users to configure their notification preferences
 */

'use client';

import { useState, useEffect } from 'react';

interface NotificationSettings {
  commitRewards: {
    enabled: boolean;
    threshold: number; // Minimum reward amount to notify
    sound: boolean;
    browser: boolean;
    email: boolean;
  };
  stakingRewards: {
    enabled: boolean;
    sound: boolean;
    browser: boolean;
    email: boolean;
  };
  milestones: {
    enabled: boolean;
    sound: boolean;
    browser: boolean;
    email: boolean;
  };
  achievements: {
    enabled: boolean;
    sound: boolean;
    browser: boolean;
    email: boolean;
  };
  repositorySuggestions: {
    enabled: boolean;
    browser: boolean;
    email: boolean;
  };
  system: {
    enabled: boolean;
    browser: boolean;
    email: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface NotificationSettingsProps {
  user: any;
  onClose: () => void;
  isOpen: boolean;
}

export function NotificationSettings({ user, onClose, isOpen }: NotificationSettingsProps) {
  // All hooks must be called before any conditional logic
  const [settings, setSettings] = useState<NotificationSettings>({
    commitRewards: {
      enabled: true,
      threshold: 25000,
      sound: true,
      browser: true,
      email: false
    },
    stakingRewards: {
      enabled: true,
      sound: false,
      browser: true,
      email: false
    },
    milestones: {
      enabled: true,
      sound: true,
      browser: true,
      email: true
    },
    achievements: {
      enabled: true,
      sound: true,
      browser: true,
      email: false
    },
    repositorySuggestions: {
      enabled: true,
      browser: true,
      email: false
    },
    system: {
      enabled: true,
      browser: true,
      email: false
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Load user's notification settings
    loadSettings();
  }, [user]);

  // Early return AFTER all hooks are called
  if (!isOpen) return null;

  const loadSettings = async () => {
    // In production, load from API
    const savedSettings = localStorage.getItem(`notification-settings-${user?.wallet_address}`);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // In production, save to API
      localStorage.setItem(
        `notification-settings-${user?.wallet_address}`, 
        JSON.stringify(settings)
      );
      
      setHasChanges(false);
      
      // Show success message
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
      
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setIsSaving(false);
    }
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      
      if (permission === 'granted') {
        // Test notification
        new Notification('ABC DAO Notifications Enabled!', {
          body: 'You\'ll now receive real-time notifications for your activity.',
          icon: '/icons/abc-logo.png'
        });
      }
    }
  };

  const updateSetting = (
    category: keyof NotificationSettings,
    key: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const testNotification = () => {
    if (browserPermission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is what your ABC DAO notifications will look like!',
        icon: '/icons/abc-logo.png',
        badge: '/icons/abc-badge.png'
      });
    } else {
      alert('Please enable browser notifications first!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-green-900/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-950/20 border-b border-green-900/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-400 matrix-glow">
                🔔 Notification Settings
              </h2>
              <p className="text-sm text-green-600 font-mono mt-1">
                Customize how and when you receive notifications
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="text-green-600 hover:text-green-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Browser Permission */}
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-400 mb-2">
                  🌐 Browser Notifications
                </h3>
                <p className="text-sm text-green-600 font-mono">
                  Status: {browserPermission === 'granted' ? '✅ Enabled' : 
                           browserPermission === 'denied' ? '❌ Blocked' : '⏳ Not Set'}
                </p>
              </div>
              
              <div className="flex gap-2">
                {browserPermission !== 'granted' && (
                  <button
                    onClick={requestBrowserPermission}
                    className="px-4 py-2 bg-blue-900/50 text-blue-400 rounded-lg font-mono text-sm hover:bg-blue-800/60 transition-colors"
                  >
                    Enable
                  </button>
                )}
                
                {browserPermission === 'granted' && (
                  <button
                    onClick={testNotification}
                    className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 transition-colors"
                  >
                    Test
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notification Categories */}
          <div className="space-y-6">
            {/* Commit Rewards */}
            <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-1">
                    💰 Commit Rewards
                  </h3>
                  <p className="text-sm text-green-600">Notifications when commits are rewarded</p>
                </div>
                
                <button
                  onClick={() => updateSetting('commitRewards', 'enabled', !settings.commitRewards.enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.commitRewards.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.commitRewards.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              
              {settings.commitRewards.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-green-600 mb-2">
                      Minimum reward threshold: {settings.commitRewards.threshold.toLocaleString()} $ABC
                    </label>
                    <input
                      type="range"
                      min="10000"
                      max="100000"
                      step="5000"
                      value={settings.commitRewards.threshold}
                      onChange={(e) => updateSetting('commitRewards', 'threshold', parseInt(e.target.value))}
                      className="w-full accent-green-600"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: 'sound', label: '🔊 Sound', enabled: settings.commitRewards.sound },
                      { key: 'browser', label: '🌐 Browser', enabled: settings.commitRewards.browser },
                      { key: 'email', label: '📧 Email', enabled: settings.commitRewards.email }
                    ].map((option) => (
                      <label key={option.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={option.enabled}
                          onChange={(e) => updateSetting('commitRewards', option.key, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-black border-green-900 rounded focus:ring-green-500"
                        />
                        <span className="text-green-600">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Staking Rewards */}
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-1">
                    🎁 Staking Rewards
                  </h3>
                  <p className="text-sm text-green-600">Notifications for claimable staking rewards</p>
                </div>
                
                <button
                  onClick={() => updateSetting('stakingRewards', 'enabled', !settings.stakingRewards.enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.stakingRewards.enabled ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.stakingRewards.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              
              {settings.stakingRewards.enabled && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'sound', label: '🔊 Sound', enabled: settings.stakingRewards.sound },
                    { key: 'browser', label: '🌐 Browser', enabled: settings.stakingRewards.browser },
                    { key: 'email', label: '📧 Email', enabled: settings.stakingRewards.email }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={option.enabled}
                        onChange={(e) => updateSetting('stakingRewards', option.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-black border-blue-900 rounded focus:ring-blue-500"
                      />
                      <span className="text-green-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Milestones & Achievements */}
            <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-purple-400 mb-1">
                    🏆 Milestones & Achievements
                  </h3>
                  <p className="text-sm text-green-600">Celebrate your progress and unlocked badges</p>
                </div>
                
                <button
                  onClick={() => updateSetting('milestones', 'enabled', !settings.milestones.enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.milestones.enabled ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.milestones.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              
              {settings.milestones.enabled && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'sound', label: '🔊 Sound', enabled: settings.milestones.sound },
                    { key: 'browser', label: '🌐 Browser', enabled: settings.milestones.browser },
                    { key: 'email', label: '📧 Email', enabled: settings.milestones.email }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={option.enabled}
                        onChange={(e) => updateSetting('milestones', option.key, e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-black border-purple-900 rounded focus:ring-purple-500"
                      />
                      <span className="text-green-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Quiet Hours */}
            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-1">
                    🌙 Quiet Hours
                  </h3>
                  <p className="text-sm text-green-600">Disable notifications during specific hours</p>
                </div>
                
                <button
                  onClick={() => updateSetting('quietHours', 'enabled', !settings.quietHours.enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.quietHours.enabled ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    settings.quietHours.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
              
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-mono text-yellow-600 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => updateSetting('quietHours', 'startTime', e.target.value)}
                      className="w-full bg-black border border-yellow-900/50 rounded-lg px-3 py-2 text-yellow-400 font-mono focus:outline-none focus:border-yellow-700/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-mono text-yellow-600 mb-2">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => updateSetting('quietHours', 'endTime', e.target.value)}
                      className="w-full bg-black border border-yellow-900/50 rounded-lg px-3 py-2 text-yellow-400 font-mono focus:outline-none focus:border-yellow-700/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-green-950/20 border-t border-green-900/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-green-600 font-mono">
              {hasChanges ? '⚠️ You have unsaved changes' : '✅ Settings saved'}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-black/40 text-green-600 border border-green-900/50 rounded-lg font-mono text-sm hover:text-green-400 hover:border-green-700/50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={saveSettings}
                disabled={!hasChanges || isSaving}
                className="px-6 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? '💾 Saving...' : '💾 Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}