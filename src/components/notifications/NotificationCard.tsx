import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/notifications';

interface NotificationCardProps {
  notification: Notification;
  onClick: () => void;
}

function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const { markAsRead } = useNotifications();

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    onClick();
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'gerade eben';
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `vor ${diffInHours} Std`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const createAcronym = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={handleClick}
      className="p-4 cursor-pointer transition-colors duration-150 hover:bg-gray-700 overflow-hidden flex gap-x-3"
    >
      {/* Avatar Column - 35px width */}
      <div className="w-[35px] flex-shrink-0">
        {notification.senderAvatar ? (
          <img
            src={notification.senderAvatar}
            alt={notification.senderName}
            className="w-[35px] h-[35px] rounded-full object-cover"
          />
        ) : (
          <div className="w-[35px] h-[35px] rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {createAcronym(notification.senderName)}
          </div>
        )}
      </div>

      {/* Content Column - remaining width, 3 rows */}
      <div className="flex-1 flex flex-col h-full">
        {/* Row 1: Notification Message with Date */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-gray-300 font-medium leading-tight overflow-hidden text-ellipsis flex-1 pr-2">
            {notification.message}
          </p>
          <div className="text-xs text-gray-400 flex-shrink-0">
            {getTimeAgo(notification.createdAt)}
          </div>
        </div>

        {/* Row 2: Subline1 (Customer Name) */}
        {notification.subline1 && (
          <div className="flex items-center mb-1">
            <span className="text-xs text-gray-400 truncate">
              {notification.subline1}
            </span>
          </div>
        )}

        {/* Row 3: Subline2 (Project/Task) - leicht gefettet */}
        {notification.subline2 && notification.subline2.trim() && (
          <div className="flex items-center">
            <div className="flex items-center text-xs text-gray-400 overflow-hidden">
              <span className="truncate font-medium">{notification.subline2}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationCard;