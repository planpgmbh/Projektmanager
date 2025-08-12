import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthState } from '../../hooks/useAuthState';
import { NotificationSettings } from '../../types/notifications';

function SettingsTabNotifications() {
  const { user } = useAuthState();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskAssignments: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(data.notifications || settings);
        }
      } catch (err) {
        console.error('Error fetching notification settings:', err);
        setError('Fehler beim Laden der Einstellungen');
      } finally {
        setIsLoading(false);
      }
    };

    // Check initial notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    fetchSettings();
  }, [user]);

  // Listen for permission changes
  useEffect(() => {
    if (!('Notification' in window)) return;

    const checkPermission = () => {
      setNotificationPermission(Notification.permission);
    };

    // Check permission periodically in case user changes it in browser settings
    const interval = setInterval(checkPermission, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        notifications: settings
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Fehler beim Speichern der Einstellungen');
    } finally {
      setIsSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        handleSettingChange('pushNotifications', true);
        // Save settings immediately when permission is granted
        await handleSave();
      } else if (permission === 'denied') {
        handleSettingChange('pushNotifications', false);
        await handleSave();
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError('Fehler beim Anfordern der Berechtigung');
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (notificationPermission !== 'granted') return;
    
    handleSettingChange('pushNotifications', enabled);
  };

  const getBrowserNotificationStatus = () => {
    if (!('Notification' in window)) {
      return {
        supported: false,
        status: 'not-supported',
        message: 'Browser-Benachrichtigungen werden von diesem Browser nicht unterstützt',
        canToggle: false,
        showButton: false
      };
    }

    switch (notificationPermission) {
      case 'granted':
        return {
          supported: true,
          status: 'granted',
          message: 'Browser-Benachrichtigungen sind aktiviert',
          canToggle: true,
          showButton: false
        };
      case 'denied':
        return {
          supported: true,
          status: 'denied',
          message: 'Browser-Benachrichtigungen sind in den Browser-Einstellungen blockiert. Bitte aktivieren Sie diese in Ihren Browser-Einstellungen.',
          canToggle: false,
          showButton: false
        };
      case 'default':
      default:
        return {
          supported: true,
          status: 'default',
          message: 'Klicken Sie auf "Erlauben", um Browser-Benachrichtigungen zu aktivieren',
          canToggle: false,
          showButton: true
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const browserNotificationStatus = getBrowserNotificationStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Benachrichtigungseinstellungen</h3>
          <p className="mt-1 text-sm text-gray-500">
            Verwalten Sie, wie und wann Sie Benachrichtigungen erhalten möchten.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
            Einstellungen erfolgreich gespeichert!
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-6">
            {/* Push Notifications */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">Browser-Benachrichtigungen</h4>
                <p className="text-sm text-gray-500 mt-1">{browserNotificationStatus.message}</p>
                
                {/* Additional info for denied state */}
                {browserNotificationStatus.status === 'denied' && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>So aktivieren Sie Benachrichtigungen:</strong>
                    </p>
                    <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                      <li>Klicken Sie auf das Schloss-Symbol in der Adressleiste</li>
                      <li>Setzen Sie "Benachrichtigungen" auf "Zulassen"</li>
                      <li>Laden Sie die Seite neu</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!browserNotificationStatus.supported ? (
                  <span className="text-sm text-gray-400">Nicht unterstützt</span>
                ) : browserNotificationStatus.showButton ? (
                  <button
                    onClick={requestNotificationPermission}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
                  >
                    Erlauben
                  </button>
                ) : browserNotificationStatus.status === 'denied' ? (
                  <div className="relative group">
                    <span className="text-sm text-red-500 font-medium cursor-help">Blockiert</span>
                    
                    {/* Hover tooltip for blocked state */}
                    <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md shadow-lg z-10">
                      <p className="text-sm font-medium mb-2">So aktivieren Sie Benachrichtigungen:</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Klicken Sie auf das Schloss-Symbol in der Adressleiste</li>
                        <li>Setzen Sie "Benachrichtigungen" auf "Zulassen"</li>
                        <li>Laden Sie die Seite neu</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => handlePushNotificationToggle(e.target.checked)}
                      disabled={!browserNotificationStatus.canToggle}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                        settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                      } mt-0.5 ml-0.5`}></div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">E-Mail-Benachrichtigungen</h4>
                <p className="text-sm text-gray-500">Erhalten Sie Benachrichtigungen per E-Mail</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                  settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

            {/* Task Assignments */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Aufgabenzuweisungen</h4>
                <p className="text-sm text-gray-500">Benachrichtigungen bei neuen Aufgabenzuweisungen</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.taskAssignments}
                  onChange={(e) => handleSettingChange('taskAssignments', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                  settings.taskAssignments ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    settings.taskAssignments ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors duration-150"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTabNotifications;