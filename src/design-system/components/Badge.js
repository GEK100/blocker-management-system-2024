import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'base',
  rounded = 'full',
  icon = null,
  iconPosition = 'left',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  // Base badge classes
  const baseClasses = `
    inline-flex items-center font-medium transition-all duration-200
  `;

  // Size variants
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    base: 'px-2.5 py-0.5 text-sm gap-1.5',
    lg: 'px-3 py-1 text-sm gap-1.5',
    xl: 'px-4 py-1.5 text-base gap-2',
  };

  // Rounded variants
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    base: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  // Color variants
  const variantClasses = {
    default: `
      bg-slate-100 text-slate-800 border border-slate-200
    `,
    primary: `
      bg-emerald-100 text-emerald-800 border border-emerald-200
    `,
    secondary: `
      bg-slate-600 text-white border border-slate-600
    `,
    success: `
      bg-success-100 text-success-800 border border-success-200
    `,
    warning: `
      bg-warning-100 text-warning-800 border border-warning-200
    `,
    danger: `
      bg-safety-100 text-safety-800 border border-safety-200
    `,
    info: `
      bg-blue-100 text-blue-800 border border-blue-200
    `,

    // Status-specific variants
    pending: `
      bg-warning-100 text-warning-800 border border-warning-200
      animate-pulse
    `,
    assigned: `
      bg-blue-100 text-blue-800 border border-blue-200
    `,
    completed: `
      bg-success-100 text-success-800 border border-success-200
    `,
    verified: `
      bg-emerald-100 text-emerald-800 border border-emerald-200
    `,
    rejected: `
      bg-safety-100 text-safety-800 border border-safety-200
    `,

    // Priority variants
    'priority-high': `
      bg-safety-100 text-safety-800 border border-safety-200
      ring-1 ring-safety-300
    `,
    'priority-medium': `
      bg-warning-100 text-warning-800 border border-warning-200
    `,
    'priority-low': `
      bg-success-100 text-success-800 border border-success-200
    `,

    // Solid variants
    'solid-primary': `
      bg-emerald-600 text-white border border-emerald-600
    `,
    'solid-secondary': `
      bg-slate-600 text-white border border-slate-600
    `,
    'solid-success': `
      bg-success-600 text-white border border-success-600
    `,
    'solid-warning': `
      bg-warning-500 text-white border border-warning-500
    `,
    'solid-danger': `
      bg-safety-600 text-white border border-safety-600
    `,

    // Outline variants
    'outline-primary': `
      bg-transparent text-emerald-600 border border-emerald-300
      hover:bg-emerald-50
    `,
    'outline-secondary': `
      bg-transparent text-slate-600 border border-slate-300
      hover:bg-slate-50
    `,
    'outline-success': `
      bg-transparent text-success-600 border border-success-300
      hover:bg-success-50
    `,
    'outline-warning': `
      bg-transparent text-warning-600 border border-warning-300
      hover:bg-warning-50
    `,
    'outline-danger': `
      bg-transparent text-safety-600 border border-safety-300
      hover:bg-safety-50
    `,
  };

  // Icon size mapping
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    base: 'h-4 w-4',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
  };

  // Render icon
  const renderIcon = (IconComponent) => {
    if (IconComponent) {
      return <IconComponent className={iconSizes[size]} />;
    }
    return null;
  };

  // Render remove button
  const renderRemoveButton = () => {
    if (!removable) return null;

    return (
      <button
        type="button"
        onClick={onRemove}
        className={`ml-1 inline-flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white transition-colors duration-200 ${
          size === 'xs' || size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
        }`}
      >
        <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
          <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    );
  };

  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${roundedClasses[rounded]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={combinedClasses} {...props}>
      {iconPosition === 'left' && renderIcon(icon)}

      <span className="truncate">
        {children}
      </span>

      {iconPosition === 'right' && renderIcon(icon)}
      {renderRemoveButton()}
    </span>
  );
};

// Dot Badge Component (notification badge)
export const DotBadge = ({
  count,
  max = 99,
  showZero = false,
  variant = 'danger',
  size = 'base',
  className = '',
  children,
  ...props
}) => {
  const shouldShow = count > 0 || showZero;

  if (!shouldShow) {
    return children || null;
  }

  // Size variants for dot badge
  const dotSizeClasses = {
    sm: 'h-4 w-4 text-xs',
    base: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
  };

  const displayCount = count > max ? `${max}+` : count.toString();

  const variantClasses = {
    primary: 'bg-emerald-500 text-white',
    danger: 'bg-safety-500 text-white',
    warning: 'bg-warning-500 text-white',
    success: 'bg-success-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  if (children) {
    // Badge with children (positioned absolutely)
    return (
      <div className="relative inline-block">
        {children}
        <span
          className={`
            absolute -top-1 -right-1 flex items-center justify-center
            ${dotSizeClasses[size]} ${variantClasses[variant]}
            rounded-full font-semibold ring-2 ring-white
            ${className}
          `}
          {...props}
        >
          {displayCount}
        </span>
      </div>
    );
  }

  // Standalone badge
  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${dotSizeClasses[size]} ${variantClasses[variant]}
        rounded-full font-semibold
        ${className}
      `}
      {...props}
    >
      {displayCount}
    </span>
  );
};

// Status Badge Component
export const StatusBadge = ({
  status,
  size = 'base',
  animated = false,
  className = '',
  ...props
}) => {
  const statusConfig = {
    pending_review: {
      variant: 'pending',
      label: 'Pending Review',
      animated: true,
    },
    assigned: {
      variant: 'assigned',
      label: 'Assigned',
    },
    in_progress: {
      variant: 'info',
      label: 'In Progress',
    },
    completed: {
      variant: 'completed',
      label: 'Completed',
    },
    verified_complete: {
      variant: 'verified',
      label: 'Verified',
    },
    rejected: {
      variant: 'rejected',
      label: 'Rejected',
    },
    cancelled: {
      variant: 'default',
      label: 'Cancelled',
    },
    on_hold: {
      variant: 'warning',
      label: 'On Hold',
    },
  };

  const config = statusConfig[status] || {
    variant: 'default',
    label: status?.replace(/_/g, ' ') || 'Unknown',
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={`
        ${config.animated && animated ? 'animate-pulse' : ''}
        capitalize
        ${className}
      `}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

// Priority Badge Component
export const PriorityBadge = ({
  priority,
  size = 'base',
  showIcon = true,
  className = '',
  ...props
}) => {
  const priorityConfig = {
    low: {
      variant: 'priority-low',
      label: 'Low',
      icon: '🟢',
    },
    medium: {
      variant: 'priority-medium',
      label: 'Medium',
      icon: '🟡',
    },
    high: {
      variant: 'priority-high',
      label: 'High',
      icon: '🔴',
    },
    critical: {
      variant: 'solid-danger',
      label: 'Critical',
      icon: '🚨',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
      {...props}
    >
      {showIcon && (
        <span className="mr-1" role="img" aria-label={`${config.label} priority`}>
          {config.icon}
        </span>
      )}
      {config.label} Priority
    </Badge>
  );
};

// Badge Group Component
export const BadgeGroup = ({
  children,
  spacing = 'default',
  wrap = true,
  className = '',
  ...props
}) => {
  const spacingClasses = {
    tight: 'gap-1',
    default: 'gap-2',
    loose: 'gap-3',
  };

  return (
    <div
      className={`
        flex items-center ${spacingClasses[spacing]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Badge;