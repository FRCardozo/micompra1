import React, { useState } from 'react';
import { Star } from 'lucide-react';

const Rating = ({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  showValue = false,
  className = '',
  ...props
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizes[size];

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className={`flex items-center gap-1 ${className}`} {...props}>
      <div className="flex items-center">
        {[...Array(max)].map((_, index) => {
          const ratingValue = index + 1;
          const isFilled = ratingValue <= displayValue;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(ratingValue)}
              onMouseEnter={() => handleMouseEnter(ratingValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={`
                transition-all duration-150
                ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                focus:outline-none
              `}
            >
              <Star
                size={iconSize}
                className={`
                  ${isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  transition-colors duration-150
                `}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Rating;
