import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  minWidth?: string;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export function Dropdown({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  className = '',
  contentClassName = '',
  maxWidth = '260px',
  minWidth = '150px',
  placement = 'bottom-left'
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (!open) {
      setIsPositioned(false);
    }
    
    if (controlledIsOpen !== undefined) {
      onOpenChange?.(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Estimate content dimensions based on minWidth/maxWidth
    const estimatedWidth = Math.min(parseInt(maxWidth), Math.max(parseInt(minWidth), 200));
    const estimatedHeight = 200; // Reasonable estimate

    let top = 0;
    let left = 0;

    // Calculate base position based on placement
    switch (placement) {
      case 'bottom-left':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.left + scrollX;
        break;
      case 'bottom-right':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.right + scrollX - estimatedWidth;
        break;
      case 'top-left':
        top = triggerRect.top + scrollY - estimatedHeight - 4;
        left = triggerRect.left + scrollX;
        break;
      case 'top-right':
        top = triggerRect.top + scrollY - estimatedHeight - 4;
        left = triggerRect.right + scrollX - estimatedWidth;
        break;
    }

    // Adjust if dropdown would go outside viewport
    if (left + estimatedWidth > viewportWidth + scrollX) {
      left = viewportWidth + scrollX - estimatedWidth - 8;
    }
    if (left < scrollX + 8) {
      left = scrollX + 8;
    }

    if (top + estimatedHeight > viewportHeight + scrollY) {
      top = triggerRect.top + scrollY - estimatedHeight - 4;
    }
    if (top < scrollY + 8) {
      top = triggerRect.bottom + scrollY + 4;
    }

    return { top, left };
  };

  const refinePosition = () => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    // Calculate base position based on placement
    switch (placement) {
      case 'bottom-left':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.left + scrollX;
        break;
      case 'bottom-right':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.right + scrollX - contentRect.width;
        break;
      case 'top-left':
        top = triggerRect.top + scrollY - contentRect.height - 4;
        left = triggerRect.left + scrollX;
        break;
      case 'top-right':
        top = triggerRect.top + scrollY - contentRect.height - 4;
        left = triggerRect.right + scrollX - contentRect.width;
        break;
    }

    // Adjust if dropdown would go outside viewport
    if (left + contentRect.width > viewportWidth + scrollX) {
      left = viewportWidth + scrollX - contentRect.width - 8;
    }
    if (left < scrollX + 8) {
      left = scrollX + 8;
    }

    if (top + contentRect.height > viewportHeight + scrollY) {
      top = triggerRect.top + scrollY - contentRect.height - 4;
    }
    if (top < scrollY + 8) {
      top = triggerRect.bottom + scrollY + 4;
    }

    setPosition({ top, left });
    setIsPositioned(true);
  };

  // Calculate initial position immediately when opening
  useEffect(() => {
    if (isOpen && !isPositioned) {
      const initialPosition = calculatePosition();
      setPosition(initialPosition);
      
      // Use requestAnimationFrame to refine position after render
      requestAnimationFrame(() => {
        refinePosition();
      });
    }
  }, [isOpen, isPositioned, placement]);

  // Handle window resize and scroll
  useEffect(() => {
    if (isOpen && isPositioned) {
      const handleResize = () => refinePosition();
      const handleScroll = () => refinePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, isPositioned, placement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={`cursor-pointer ${className}`}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={contentRef}
          className={`fixed z-[9999] bg-white rounded-md shadow-lg border border-gray-200 transition-opacity duration-150 ${
            isPositioned ? 'opacity-100' : 'opacity-0'
          } ${contentClassName}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            minWidth,
            maxWidth,
            width: 'auto'
          }}
        >
          {children}
        </div>
      )}
    </>
  );
}