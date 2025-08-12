import React from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function CustomScrollbar({ 
  children, 
  className = '',
  maxHeight = 'h-full'
}: CustomScrollbarProps) {
  return (
    <div 
      className={`overflow-y-auto ${maxHeight} ${className}`}
      style={{
        // Ensure scrollbar is always visible on webkit browsers when content overflows
        overflowY: 'auto',
        // Enable momentum scrolling on iOS
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </div>
  );
}