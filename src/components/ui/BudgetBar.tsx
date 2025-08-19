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
  const getBudgetUsage = () => {
    if (budget === 0) {
      // Wenn kein Budget festgelegt ist
      if (totalValue === 0) {
        return { percentage: 0, isOverBudget: false };
      } else {
        // Zeige vollen Balken wenn Aufwand vorhanden aber kein Budget
        return { percentage: 100, isOverBudget: true };
      }
    }
    
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

  // Immer einen Balken anzeigen wenn showPlaceholder true ist oder wenn totalValue > 0
  if (budget === 0 && totalValue === 0 && !showPlaceholder) {
    return null;
  }

  return (
    <div className={`w-full bg-gray-100 rounded-full ${heightClasses[height]} ${className}`}>
      <div 
        className={`${heightClasses[height]} rounded-full transition-all duration-300 ${
          budgetUsage.isOverBudget ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{ width: `${budgetUsage.percentage}%` }}
      ></div>
    </div>
  );
}