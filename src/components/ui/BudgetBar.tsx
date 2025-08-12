import React from 'react';

interface BudgetBarProps {
  totalValue: number;
  budget: number;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
  showPlaceholder?: boolean;
}

export function BudgetBar({ 
  totalValue, 
  budget, 
  className = '',
  height = 'sm',
  showPlaceholder = false
}: BudgetBarProps) {
  // Wenn kein Budget vorhanden ist
  if (budget === 0) {
    if (showPlaceholder) {
      // Grauer Platzhalter-Balken
      const heightClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
      };
      
      return (
        <div className={`w-full bg-gray-100 rounded-full ${heightClasses[height]} ${className}`}>
          <div className={`${heightClasses[height]} rounded-full bg-gray-200 w-0`}></div>
        </div>
      );
    }
    
    // Kein Budget = keine Anzeige
    return null;
  }

  const getBudgetUsage = () => {
    const percentage = Math.min((totalValue / budget) * 100, 100);
    const isOverBudget = totalValue > budget;
    
    return { percentage, isOverBudget };
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const budgetUsage = getBudgetUsage();

  return (
    <div className={`w-full bg-gray-200 rounded-full ${heightClasses[height]} ${className}`}>
      <div 
        className={`${heightClasses[height]} rounded-full transition-all duration-300 ${
          budgetUsage.isOverBudget ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{ width: `${budgetUsage.percentage}%` }}
      ></div>
    </div>
  );
}