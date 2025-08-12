import React from 'react';
import { X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCard from './NotificationCard';
import { CustomScrollbar } from '../ui/CustomScrollbar';

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const handleSettingsClick = () => {
    navigate('/settings?tab=notifications');
    onClose();
  };

  const handleNotificationClick = (notification: any) => {
    navigate(notification.targetUrl);
    onClose();
  };

  if (!isOpen) return null;

  // Show unread notifications first, if none exist show read notifications
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  
  const displayNotifications = unreadNotifications.length > 0 ? unreadNotifications : readNotifications;
  const showingReadOnly = unreadNotifications.length === 0 && readNotifications.length > 0;

  return (
    <div 
      className="bg-[#2E2E30] text-white z-30 h-screen resize-x overflow-hidden cursor-ew-resize"
      style={{ 
        minWidth: '350px', 
        width: '350px',
        resize: 'horizontal'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <h2 className="text-lg font-semibold text-gray-300">Nachrichten</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSettingsClick}
            className="p-1.5 hover:bg-gray-600 rounded-full transition-colors text-gray-300"
            title="Benachrichtigungseinstellungen"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-600 rounded-full transition-colors text-gray-300"
            title="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <CustomScrollbar className="flex-1">
        {displayNotifications.length > 0 ? (
          <div className="divide-y divide-gray-600">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={showingReadOnly ? 'opacity-40' : ''}
              >
                <NotificationCard
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <div className="text-center">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-sm">Keine Benachrichtigungen vorhanden</p>
            </div>
          </div>
        )}
      </CustomScrollbar>
    </div>
  );
}

export default NotificationSidebar;