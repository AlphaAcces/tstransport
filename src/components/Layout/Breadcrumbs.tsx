import React from 'react';

interface BreadcrumbsProps {
  items: string[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, i) => (
          <li key={`${it}-${i}`} className="inline-flex items-center">
            <span className={i === items.length - 1 ? 'text-gray-200 font-medium' : 'text-gray-400'}>{it}</span>
            {i < items.length - 1 && <span className="mx-2 text-gray-500">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};
