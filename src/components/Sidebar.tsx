import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Clock, 
  Settings,
  ChevronRight,
  LogOut,
  Building2,
  CircleDot,
  Menu,
  X,
  FileText,
  Receipt,
  Bell,
  ListTodo
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Link, useLocation } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationSidebar from './notifications/NotificationSidebar';

const menuItems = [
  { icon: LayoutDashboard, text: 'Dashboard', path: '/dashboard' },
  { icon: Clock, text: 'Zeiterfassung', path: '/schedule' },
  { icon: ListTodo, text: 'Meine Aufgaben', path: '/mytasks' },
  { icon: FolderKanban, text: 'Projekte', path: '/projects' },
  { icon: Building2, text: 'Kunden', path: '/customers' },
  { icon: FileText, text: 'Angebote', path: '/orders' },
  { icon: Receipt, text: 'Rechnungen', path: '/invoices' },
  { icon: Users, text: 'Team', path: '/team' },
  { icon: Settings, text: 'Einstellungen', path: '/settings' },
];

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();
  const { isTimerActive } = useTimer();
  const { hasUnread, unreadCount } = useNotifications();

  const handleLogout = () => {
    signOut(auth);
  };

  // Check screen size and auto-expand on large screens
  useEffect(() => {
    const checkScreenSize = () => {
      const isLarge = window.innerWidth > 1280;
      setIsLargeScreen(isLarge);
      
      // Auto-expand on large screens, but allow manual control on smaller screens
      if (isLarge) {
        setIsExpanded(true);
      }
    };

    // Check initial screen size
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse enter/leave only on smaller screens
  const handleMouseEnter = () => {
    if (!isLargeScreen && !isNotificationOpen) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isLargeScreen && !isNotificationOpen) {
      setIsExpanded(false);
    }
  };

  // Collapse sidebar when notification panel is open on smaller screens
  const effectiveIsExpanded = isNotificationOpen && !isLargeScreen ? false : isExpanded;

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  return (
    <div className="flex">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#2E2E30] text-[#F5F4F3] shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Combined Navigation and Notification Container */}
      <div className="flex">
        {/* Main Navigation */}
        <div 
          className={`bg-[#2E2E30] text-[#F5F4F3] shadow-lg transition-all duration-300 ease-in-out fixed md:sticky top-0 z-40
            ${isMobileMenuOpen ? 'left-0' : '-left-64'} 
            md:left-0
            ${effectiveIsExpanded ? 'w-64' : 'w-16'} 
            h-screen flex flex-col`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-start pt-6 pb-4 px-4">
            <CircleDot className="h-8 w-8 stroke-[1.25]" />
            <ChevronRight 
              className={`hidden md:block h-5 w-5 mt-1.5 ml-auto transition-transform duration-300 stroke-[1.25] ${
                effectiveIsExpanded ? 'rotate-180' : ''
              } ${isLargeScreen ? 'opacity-50' : ''}`} 
            />
          </div>
          
          <nav className="flex-1 pt-2">
            {/* Notifications Navigation Item - First Position */}
            <button
              onClick={handleNotificationClick}
              className={`relative flex items-center py-4 w-full ${
                effectiveIsExpanded ? 'px-6' : 'justify-center'
              } ${
                isNotificationOpen 
                  ? 'text-[#F5F4F3] bg-white/10' 
                  : 'text-[#F5F4F3]/70 hover:text-[#F5F4F3] hover:bg-white/5'
              } ${
                hasUnread ? 'text-blue-400' : ''
              }`}
            >
              {/* Blue indicator bar when notifications are present */}
              {hasUnread && (
                <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full" />
              )}
              
              <div className="relative">
                <Bell className={`h-5 w-5 flex-shrink-0 stroke-[1.25] ${
                  hasUnread ? 'animate-bounce text-blue-500' : ''
                }`} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              {(effectiveIsExpanded || isMobileMenuOpen) && (
                <span className="ml-4 text-sm font-medium">
                  Benachrichtigungen
                </span>
              )}
              {!effectiveIsExpanded && !isMobileMenuOpen && (
                <span className="sr-only">Benachrichtigungen</span>
              )}
            </button>

            {/* Regular Menu Items */}
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              const isTimeTrackingWithActiveTimer = item.path === '/schedule' && isTimerActive;
              
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`relative flex items-center py-4 ${
                    effectiveIsExpanded ? 'px-6' : 'justify-center'
                  } ${
                    isActive 
                      ? 'text-[#F5F4F3] bg-white/10' 
                      : 'text-[#F5F4F3]/70 hover:text-[#F5F4F3] hover:bg-white/5'
                  } ${
                    isTimeTrackingWithActiveTimer && !isActive
                      ? 'bg-blue-500/20'
                      : ''
                  }`}
                >
                  {/* Blauer Reiter für aktive Zeiterfassung */}
                  {isTimeTrackingWithActiveTimer && isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full" />
                  )}
                  
                  {/* Normaler Reiter für andere aktive Seiten */}
                  {isActive && !isTimeTrackingWithActiveTimer && !effectiveIsExpanded && (
                    <div className="absolute left-0 w-1 h-8 bg-[#F5F4F3] rounded-r-full" />
                  )}
                  
                  <item.icon 
                    className={`h-5 w-5 flex-shrink-0 stroke-[1.25] ${
                      isTimeTrackingWithActiveTimer
                        ? 'text-blue-500 animate-spin'
                        : ''
                    }`} 
                  />
                  {(effectiveIsExpanded || isMobileMenuOpen) && (
                    <span className="ml-4 text-sm font-medium">
                      {item.text}
                    </span>
                  )}
                  {!effectiveIsExpanded && !isMobileMenuOpen && (
                    <span className="sr-only">{item.text}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pb-6">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center py-4 ${
                effectiveIsExpanded ? 'px-6' : 'justify-center'
              } text-[#F5F4F3]/70 hover:text-[#F5F4F3] hover:bg-white/5`}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 stroke-[1.25]" />
              {(effectiveIsExpanded || isMobileMenuOpen) && (
                <span className="ml-4 text-sm font-medium">
                  Abmelden
                </span>
              )}
              {!effectiveIsExpanded && !isMobileMenuOpen && (
                <span className="sr-only">Abmelden</span>
              )}
            </button>
          </div>
        </div>

        {/* Visual separator line with matching gray color */}
        {isNotificationOpen && (
          <div className="w-px bg-gray-600 h-screen z-30"></div>
        )}

        {/* Notification Sidebar - positioned next to navigation */}
        <NotificationSidebar 
          isOpen={isNotificationOpen} 
          onClose={() => setIsNotificationOpen(false)} 
        />
      </div>
    </div>
  );
}

export default Sidebar;