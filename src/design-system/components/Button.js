import React from 'react';
import { brandConfig } from '../brand';

const Button = ({
  children,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Base button classes
  const baseClasses = `
    btn
    touch-manipulation select-none
  `;

  // Size variants
  const sizeClasses = {
    xs: 'btn-sm text-xs min-h-[28px] gap-1',
    sm: 'btn-sm min-h-[32px] gap-1.5',
    base: 'min-h-[40px] gap-2',
    lg: 'btn-lg min-h-[48px] gap-2',
    xl: 'btn-xl min-h-[56px] gap-2.5',
  };

  // Variant styles
  const variantClasses = {
    primary: `
      btn-primary
    `,
    secondary: `
      btn-secondary
    `,
    success: `
      btn-success
    `,
    warning: `
      btn-warning
    `,
    danger: `
      btn-danger
    `,
    outline: `
      btn-outline
    `,
    'outline-construction': `
      btn-outline-construction
    `,
    ghost: `
      btn-ghost
    `,
    'ghost-construction': `
      btn-ghost text-construction-600 hover:text-construction-700 hover:bg-construction-50 focus:ring-construction-500
    `,
  };

  // Icon size mapping
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    base: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  // Loading spinner component
  const LoadingSpinner = ({ size }) => (
    <svg
      className={`animate-spin ${iconSizes[size]}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Render icon
  const renderIcon = (IconComponent, position) => {
    if (loading && position === 'left') {
      return <LoadingSpinner size={size} />;
    }

    if (IconComponent) {
      return (
        <IconComponent
          className={`${iconSizes[size]} ${
            loading && position === 'right' ? 'opacity-50' : ''
          }`}
        />
      );
    }

    return null;
  };

  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClasses}
      {...props}
    >
      {iconPosition === 'left' && renderIcon(icon, 'left')}

      <span className={loading ? 'opacity-75' : ''}>
        {children}
      </span>

      {iconPosition === 'right' && renderIcon(icon, 'right')}
    </button>
  );
};

// Button Group Component
export const ButtonGroup = ({
  children,
  variant = 'primary',
  size = 'base',
  orientation = 'horizontal',
  attached = true,
  className = '',
  ...props
}) => {
  const orientationClasses = orientation === 'vertical' ? 'flex-col' : 'flex-row';
  const attachedClasses = attached ? (orientation === 'vertical' ? 'divide-y' : 'divide-x') : 'gap-2';

  const groupClasses = `
    inline-flex ${orientationClasses} ${attachedClasses}
    ${attached ? 'divide-slate-200 overflow-hidden rounded-lg shadow-sm' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={groupClasses} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child, {
            variant: child.props.variant || variant,
            size: child.props.size || size,
            className: attached ? `${child.props.className || ''} rounded-none` : child.props.className,
          });
        }
        return child;
      })}
    </div>
  );
};

// Icon Button Component
export const IconButton = ({
  icon: Icon,
  'aria-label': ariaLabel,
  size = 'base',
  variant = 'ghost',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 p-1',
    sm: 'w-8 h-8 p-1.5',
    base: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
    xl: 'w-14 h-14 p-3',
  };

  const iconSizes = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    base: 'h-6 w-6',
    lg: 'h-7 w-7',
    xl: 'h-8 w-8',
  };

  return (
    <Button
      variant={variant}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
    </Button>
  );
};

// Floating Action Button
export const FloatingActionButton = ({
  icon: Icon,
  children,
  size = 'lg',
  variant = 'primary',
  position = 'bottom-right',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  const fabClasses = `
    ${positionClasses[position]} z-50 rounded-full shadow-2xl
    hover:shadow-construction-lg transform hover:scale-110 active:scale-95
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (children) {
    return (
      <Button
        variant={variant}
        size={size}
        icon={Icon}
        className={fabClasses}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <IconButton
      icon={Icon}
      variant={variant}
      size={size}
      className={fabClasses}
      {...props}
    />
  );
};

// Button with confirmation
export const ConfirmButton = ({
  children,
  confirmText = 'Are you sure?',
  confirmVariant = 'danger',
  onConfirm,
  ...props
}) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleClick = () => {
    if (showConfirm) {
      onConfirm?.();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <Button
      {...props}
      variant={showConfirm ? confirmVariant : props.variant}
      onClick={handleClick}
    >
      {showConfirm ? confirmText : children}
    </Button>
  );
};

export default Button;