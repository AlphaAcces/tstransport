import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ViewContainerProps {
  children: React.ReactNode;
  canGoBack: boolean;
  onGoBack: () => void;
}

export const ViewContainer: React.FC<ViewContainerProps> = ({ children, canGoBack, onGoBack }) => {
  return (
    <div>
      {canGoBack && (
        <button
          onClick={onGoBack}
          className="mb-4 inline-flex items-center text-sm text-gray-300 hover:text-accent-green transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage til Dashboard
        </button>
      )}
      {children}
    </div>
  );
};