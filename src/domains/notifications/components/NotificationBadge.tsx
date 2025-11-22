/**
 * NotificationBadge Component
 * 
 * Displays unread notification count in TopBar.
 */

import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200 rounded-lg hover:bg-gray-800/50"
      aria-label={`Notifications (${count} unread)`}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};
