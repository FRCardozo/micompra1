import React from 'react';
import { Package } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Package,
  title = 'No items found',
  description = '',
  action,
  className = '',
  iconSize = 48,
  ...props
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      {...props}
    >
      <div className="mb-4 p-4 bg-gray-100 rounded-full">
        <Icon size={iconSize} className="text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
