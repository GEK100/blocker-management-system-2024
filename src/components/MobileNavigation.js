import React, { useState, useEffect } from 'react';
import {
  HomeIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  DocumentIcon as DocumentIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';

const MobileTabButton = ({
  icon: Icon,
  iconSolid: IconSolid,
  label,
  active,
  onClick,
  badge,
  longPress = false,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsPressed(true);

    if (longPress) {
      const timer = setTimeout(() => {
        // Trigger haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        // Handle long press action
        onClick(true);
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (!longPress && !disabled) {
      onClick(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !longPress) {
      onClick(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center py-2 px-1 min-h-[60px]
        transition-all duration-200 touch-manipulation relative
        ${active
          ? 'text-construction-600 bg-construction-50 scale-105'
          : disabled
            ? 'text-slate-300 cursor-not-allowed opacity-50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 active:bg-slate-100'
        }
        ${isPressed ? 'scale-95' : ''}
      `}
    >
      <div className="relative">
        {active && IconSolid ? (
          <IconSolid className="h-6 w-6" />
        ) : (
          <Icon className="h-6 w-6" />
        )}

        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 bg-construction-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {longPress && !disabled && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-1 bg-construction-400 rounded-full"></div>
          </div>
        )}
      </div>

      <span className={`text-xs font-medium mt-1 leading-tight transition-colors duration-200 ${
        active ? 'text-construction-700' : ''
      }`}>
        {label}
      </span>

      {/* Active indicator */}
      {active && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-construction-500 rounded-b-full"></div>
      )}
    </button>
  );
};

const MobileFloatingButton = ({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'lg',
  position = 'bottom-right',
  badge,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-construction-600 hover:bg-construction-700 text-white shadow-construction-lg',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-lg',
    success: 'bg-success-600 hover:bg-success-700 text-white shadow-lg',
    danger: 'bg-safety-600 hover:bg-safety-700 text-white shadow-lg',
    white: 'bg-white hover:bg-slate-50 text-slate-700 shadow-lg border border-slate-200'
  };

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const positions = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-left': 'bottom-20 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        fixed z-50 ${positions[position]} ${sizes[size]} ${variants[variant]}
        rounded-full flex items-center justify-center
        transition-all duration-300 transform hover:scale-110
        touch-manipulation active:scale-95 animate-bounce-gentle
        ${isPressed ? 'scale-95' : ''}
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />

      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-6 w-6 bg-safety-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

const MobileBottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'half', // 'quarter', 'half', 'full', 'auto'
  showDragHandle = true,
  backdrop = true
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const heightClasses = {
    quarter: 'max-h-[25vh]',
    half: 'max-h-[50vh]',
    full: 'max-h-[90vh]',
    auto: 'max-h-[80vh]'
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragY;

    if (deltaY > 0) { // Only allow downward drag
      e.currentTarget.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    const deltaY = e.changedTouches[0].clientY - dragY;

    if (deltaY > 100) { // Threshold for closing
      onClose();
    } else {
      e.currentTarget.style.transform = 'translateY(0px)';
    }

    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
          ${heightClasses[height]} animate-slide-in-up touch-manipulation
        `}
        onTouchStart={showDragHandle ? handleTouchStart : undefined}
        onTouchMove={showDragHandle ? handleTouchMove : undefined}
        onTouchEnd={showDragHandle ? handleTouchEnd : undefined}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 touch-manipulation"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

const MobilePullToRefresh = ({
  onRefresh,
  isRefreshing,
  threshold = 80,
  children,
  className = ''
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = (e) => {
    if (e.currentTarget.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || e.currentTarget.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY) * 0.5); // Damping factor

    setPullDistance(Math.min(distance, threshold * 1.5));
  };

  const handleTouchEnd = () => {
    if (pullDistance >= threshold && !isRefreshing) {
      onRefresh();
    }

    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  return (
    <div
      className={`relative overflow-auto touch-manipulation ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10"
        style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <div className="bg-white rounded-full p-3 shadow-lg">
          {isRefreshing || pullDistance >= threshold ? (
            <div className="w-6 h-6 border-2 border-construction-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div
              className="w-6 h-6 text-construction-500 transition-transform duration-200"
              style={{ transform: `rotate(${Math.min(pullDistance / threshold * 180, 180)}deg)` }}
            >
              ↓
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
};

const MobileNavigationProvider = ({ children, user, onNavigate, notifications = 0 }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Define navigation tabs based on user role
  const getNavigationTabs = () => {
    const baseTabs = [
      {
        key: 'home',
        icon: HomeIcon,
        iconSolid: HomeIconSolid,
        label: 'Home',
        badge: 0
      }
    ];

    if (user?.role === 'field_worker' || user?.role === 'subcontractor') {
      baseTabs.push(
        {
          key: 'create',
          icon: PlusIcon,
          iconSolid: PlusIconSolid,
          label: 'Create',
          longPress: true
        },
        {
          key: 'blockers',
          icon: ClipboardDocumentListIcon,
          iconSolid: ClipboardDocumentListIconSolid,
          label: 'My Reports',
          badge: 0
        },
        {
          key: 'floor-plan',
          icon: DocumentIcon,
          iconSolid: DocumentIconSolid,
          label: 'Floor Plan'
        }
      );
    }

    if (['company_admin', 'company_owner', 'main_contractor'].includes(user?.role)) {
      baseTabs.push(
        {
          key: 'analytics',
          icon: ChartBarIcon,
          iconSolid: ChartBarIconSolid,
          label: 'Analytics'
        }
      );
    }

    return baseTabs;
  };

  const navigationTabs = getNavigationTabs();

  const handleTabClick = (tabKey, isLongPress = false) => {
    if (isLongPress && tabKey === 'create') {
      setShowQuickActions(true);
      return;
    }

    setActiveTab(tabKey);
    onNavigate?.(tabKey);
  };

  const quickActions = [
    { key: 'photo', icon: CameraIcon, label: 'Take Photo' },
    { key: 'blocker', icon: PlusIcon, label: 'New Blocker' },
    { key: 'location', icon: DocumentIcon, label: 'Mark Location' }
  ];

  return (
    <>
      {children}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-bottom">
        <div className={`grid grid-cols-${navigationTabs.length} divide-x divide-slate-100`}>
          {navigationTabs.map((tab) => (
            <MobileTabButton
              key={tab.key}
              icon={tab.icon}
              iconSolid={tab.iconSolid}
              label={tab.label}
              active={activeTab === tab.key}
              onClick={(isLongPress) => handleTabClick(tab.key, isLongPress)}
              badge={tab.badge}
              longPress={tab.longPress}
            />
          ))}
        </div>
      </nav>

      {/* Floating Action Button for Quick Camera Access */}
      {(user?.role === 'field_worker' || user?.role === 'subcontractor') && (
        <MobileFloatingButton
          icon={CameraIcon}
          onClick={() => handleTabClick('camera')}
          position="bottom-right"
          className="mb-20" // Above bottom nav
        />
      )}

      {/* Notifications Floating Button */}
      {notifications > 0 && (
        <MobileFloatingButton
          icon={BellIcon}
          onClick={() => handleTabClick('notifications')}
          position="top-right"
          badge={notifications}
          variant="white"
          size="md"
        />
      )}

      {/* Quick Actions Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="Quick Actions"
        height="quarter"
      >
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={() => {
                  handleTabClick(action.key);
                  setShowQuickActions(false);
                }}
                className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 touch-manipulation"
              >
                <action.icon className="h-8 w-8 text-construction-600 mb-2" />
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </MobileBottomSheet>

      {/* Menu Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Menu"
        height="half"
      >
        <div className="p-6">
          <div className="space-y-4">
            <button className="flex items-center w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 touch-manipulation">
              <UserIcon className="h-6 w-6 text-slate-600 mr-3" />
              <span className="text-base font-medium text-slate-700">Profile</span>
            </button>
            <button className="flex items-center w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 touch-manipulation">
              <Cog6ToothIcon className="h-6 w-6 text-slate-600 mr-3" />
              <span className="text-base font-medium text-slate-700">Settings</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
};

export {
  MobileTabButton,
  MobileFloatingButton,
  MobileBottomSheet,
  MobilePullToRefresh,
  MobileNavigationProvider
};

export default MobileNavigationProvider;