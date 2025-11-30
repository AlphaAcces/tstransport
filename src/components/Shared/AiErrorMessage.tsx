import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AiErrorMessageProps {
  title?: string;
  description?: string;
  details?: string;
  onRetry?: () => void;
}

/**
 * Presents a consistent, user-friendly error state for AI-powered panels.
 * Uses softer amber/yellow tones instead of harsh red for a less alarming appearance.
 */
export const AiErrorMessage: React.FC<AiErrorMessageProps> = ({
  title = 'Fejl under analyse',
  description = 'Prøv igen om lidt eller justér prompten.',
  details,
  onRetry,
}) => {
  return (
    <div
      className="ai-error flex flex-col items-center text-center space-y-3"
      role="alert"
      aria-live="polite"
    >
      <div className="p-3 rounded-full bg-amber-500/10">
        <AlertTriangle className="w-6 h-6 text-amber-500" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-sm sm:text-base text-amber-400">{title}</p>
        {description && (
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xs">
            {description}
          </p>
        )}
      </div>
      {details && (
        <p className="text-xs text-gray-500 bg-base-dark px-3 py-2 rounded border border-border-dark/60 max-w-sm font-mono">
          {details}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Prøv igen
        </button>
      )}
    </div>
  );
};
