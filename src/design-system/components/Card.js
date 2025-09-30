import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'default',
  hover = false,
  clickable = false,
  className = '',
  onClick,
  ...props
}) => {
  // Base card classes
  const baseClasses = `
    bg-white overflow-hidden transition-all duration-200
  `;

  // Variant styles
  const variantClasses = {
    default: `
      border border-slate-200 shadow-sm rounded-xl
    `,
    elevated: `
      border border-slate-200 shadow-lg rounded-xl
    `,
    emerald: `
      border border-emerald-200 shadow-emerald rounded-xl
    `,
    flat: `
      bg-slate-50 border border-slate-200 rounded-lg
    `,
    outline: `
      border-2 border-slate-200 rounded-xl
    `,
    'outline-emerald': `
      border-2 border-emerald-200 rounded-xl
    `,
    gradient: `
      bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-md rounded-xl
    `,
    'gradient-emerald': `
      bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 shadow-emerald rounded-xl
    `,
  };

  // Padding variants
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Hover effects
  const hoverClasses = hover ? `
    hover:shadow-lg hover:-translate-y-1 transform
  ` : '';

  // Clickable effects
  const clickableClasses = clickable ? `
    cursor-pointer hover:shadow-md transform hover:-translate-y-0.5
    active:translate-y-0 active:shadow-sm
  ` : '';

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Card Header Component
export const CardHeader = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex items-start justify-between p-6 border-b border-slate-200 ${className}`}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
        {!title && !subtitle && children}
      </div>
      {actions && (
        <div className="ml-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

// Card Body Component
export const CardBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 bg-slate-50 border-t border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Stat Card Component
export const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue',
  className = '',
  ...props
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
      text: 'text-emerald-700',
    },
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      icon: 'text-success-600',
      text: 'text-success-700',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: 'text-warning-600',
      text: 'text-warning-700',
    },
    safety: {
      bg: 'bg-safety-50',
      border: 'border-safety-200',
      icon: 'text-safety-600',
      text: 'text-safety-700',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      icon: 'text-slate-600',
      text: 'text-slate-700',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-success-600';
    if (trend === 'down') return 'text-safety-600';
    return 'text-slate-500';
  };

  return (
    <Card
      variant="default"
      hover
      className={`${className}`}
      {...props}
    >
      <div className="p-6">
        <div className="flex items-center">
          {Icon && (
            <div className={`flex-shrink-0 p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
          )}
          <div className={`${Icon ? 'ml-4' : ''} flex-1`}>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="flex items-baseline mt-1">
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              {change && (
                <span className={`ml-2 text-sm font-medium ${getTrendColor(trend)}`}>
                  {change}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Feature Card Component
export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  href,
  onClick,
  variant = 'default',
  className = '',
  ...props
}) => {
  const isClickable = href || onClick;

  return (
    <Card
      variant={variant}
      hover={isClickable}
      clickable={isClickable}
      onClick={onClick}
      className={`text-left ${className}`}
      {...props}
    >
      <div className="p-6">
        {Icon && (
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
              <Icon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-slate-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
};

// Product Card Component
export const ProductCard = ({
  image,
  title,
  description,
  price,
  badge,
  actions,
  href,
  onClick,
  className = '',
  ...props
}) => {
  const isClickable = href || onClick;

  return (
    <Card
      variant="default"
      padding="none"
      hover={isClickable}
      clickable={isClickable}
      onClick={onClick}
      className={className}
      {...props}
    >
      {/* Image */}
      {image && (
        <div className="relative aspect-w-16 aspect-h-9 bg-slate-100">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover"
          />
          {badge && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {badge}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {price && (
            <span className="text-xl font-bold text-emerald-600">
              {price}
            </span>
          )}

          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Card Grid Component
export const CardGrid = ({
  children,
  columns = 'auto',
  gap = 'default',
  className = '',
  ...props
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    default: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  return (
    <div
      className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;