import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function InfoTooltip({ title, description, details }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="ml-2 text-textSecondary hover:text-primary transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-surface border-2 border-primary rounded-lg shadow-xl bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-primary"></div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="font-bold text-primary">{title}</div>
            <div className="text-sm text-textPrimary">{description}</div>
            {details && (
              <div className="text-xs text-textSecondary border-t border-border pt-2 mt-2">
                {details}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
