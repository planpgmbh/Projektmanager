import React from 'react';
import { MoreHorizontal } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TeamMembersProps {
  users: User[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  onManageClick?: () => void;
  className?: string;
}

export function TeamMembers({ 
  users, 
  maxVisible = 3,
  size = 'md',
  onManageClick,
  className = ''
}: TeamMembersProps) {
  // Pastel colors for team members (independent of roles)
  const memberColors = [
    'bg-blue-300',
    'bg-green-300', 
    'bg-purple-300',
    'bg-orange-300',
    'bg-pink-300',
    'bg-indigo-300',
    'bg-teal-300',
    'bg-red-300'
  ];

  const createUserInitials = (user: User): string => {
    const first = user.firstName?.charAt(0)?.toUpperCase() || '';
    const last = user.lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm'
  };

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = Math.max(0, users.length - maxVisible);

  return (
    <div className={`flex items-center ${className}`}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-gray-800 font-light ${memberColors[index % memberColors.length]} ${
            index > 0 ? '-ml-1' : ''
          } border border-gray-400 shadow-[0_0_0_1px_white] cursor-pointer hover:scale-110 transition-transform duration-150`}
          title={`${user.firstName} ${user.lastName} (${user.role})`}
          style={{ zIndex: visibleUsers.length - index }}
          onClick={(e) => {
            e.stopPropagation();
            onManageClick?.();
          }}
        >
          {createUserInitials(user)}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-200 text-gray-800 font-light flex items-center justify-center ${
            visibleUsers.length > 0 ? '-ml-1' : ''
          } border border-gray-400 shadow-[0_0_0_1px_white] cursor-pointer hover:scale-110 transition-transform duration-150`}
          title={`+${remainingCount} weitere Mitglieder`}
          style={{ zIndex: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onManageClick?.();
          }}
        >
          +{remainingCount}
        </div>
      )}
      
      {onManageClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageClick();
          }}
          className={`${sizeClasses[size]} rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors duration-150 ${
            users.length > 0 ? '-ml-1' : ''
          } border border-gray-400 shadow-[0_0_0_1px_white]`}
          title="Personen verwalten"
        >
          <MoreHorizontal className={`${size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600`} />
        </button>
      )}
    </div>
  );
}