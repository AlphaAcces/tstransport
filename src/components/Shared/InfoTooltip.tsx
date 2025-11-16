
import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-component-dark text-white text-xs rounded-md shadow-lg z-10 border border-border-dark">
          {text}
           <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-component-dark"></div>
        </div>
      )}
    </div>
  );
};
