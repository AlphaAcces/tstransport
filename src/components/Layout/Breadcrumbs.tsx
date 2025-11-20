import React from 'react';

interface BreadcrumbsProps {
  items: string[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((it, i) => (
          <li key={it} className="inline-flex items-center">
            <span className={i === items.length - 1 ? 'text-gray-200 font-medium' : 'text-gray-400'}>{it}</span>
            {i < items.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};
