
import React from 'react';

interface TagProps {
  label: string;
  color: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  size?: 'sm' | 'md';
}

const colorClasses = {
  green: 'bg-green-800 text-green-300 border-green-600',
  red: 'bg-red-800 text-red-300 border-red-600',
  yellow: 'bg-yellow-800 text-yellow-300 border-yellow-600',
  blue: 'bg-blue-800 text-blue-300 border-blue-600',
  gray: 'bg-gray-700 text-gray-300 border-gray-500',
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1'
}

export const Tag: React.FC<TagProps> = ({ label, color, size = 'sm' }) => {
  return (
    <span className={`inline-block rounded-full font-mono font-medium border ${colorClasses[color]} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
};
