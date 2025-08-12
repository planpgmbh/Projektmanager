import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface PopupProps {
  title: string | React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function Popup({
  title,
  onClose,
  children,
  footer,
  maxWidth = '2xl'
}: PopupProps) {
  const maxWidthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col`}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex-1 pr-4">{title}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 flex-shrink-0">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface PopupFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PopupFooter({ children, className = '' }: PopupFooterProps) {
  return (
    <div className={`flex justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
}

interface PopupDangerButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function PopupDangerButton({ onClick, isLoading, children }: PopupDangerButtonProps) {
  return (
    <Button
      variant="danger"
      onClick={onClick}
      isLoading={isLoading}
      className="mr-auto"
    >
      {children}
    </Button>
  );
}

export default Popup