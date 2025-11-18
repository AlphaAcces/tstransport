import React from 'react';
import { ServerCrash } from 'lucide-react';

interface AiErrorMessageProps {
  title?: string;
  description?: string;
  details?: string;
}

/**
 * Presents a consistent error state for AI-powered panels with optional description and details.
 */
export const AiErrorMessage: React.FC<AiErrorMessageProps> = ({
  title = 'Fejl under analyse',
  description = 'Prøv igen om lidt eller justér prompten.',
  details,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-red-400 text-center space-y-3">
      <ServerCrash className="w-8 h-8" />
      <div>
        <p className="font-semibold text-sm sm:text-base">{title}</p>
        {description && (
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xs">
            {description}
          </p>
        )}
      </div>
      {details && (
        <p className="text-xs text-gray-500 bg-base-dark px-3 py-2 rounded border border-border-dark/60 max-w-sm">
          {details}
        </p>
      )}
    </div>
  );
};
