import React from 'react';
import { Download } from 'lucide-react';

interface Project {
  id: string;
  totalBudget?: number;
  workflow?: {
    offerCreated?: {
      offerId?: string;
      offerNumber?: string;
      status?: string;
    };
  };
}

interface ProjectBudgetCardProps {
  project: Project;
  totalValue: number;
  isEditing: boolean;
  isUpdating: boolean;
  budget: string;
  onBudgetChange: (budget: string) => void;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  formatCurrency: (amount: number) => string;
  budgetUpdateEffect?: boolean;
  onImportFromOffer?: () => void;
}

function ProjectBudgetCard({
  project,
  totalValue,
  isEditing,
  isUpdating,
  budget,
  onBudgetChange,
  onStartEditing,
  onSave,
  onCancel,
  onKeyDown,
  formatCurrency,
  budgetUpdateEffect = false,
  onImportFromOffer
}: ProjectBudgetCardProps) {
  // Calculate budget usage percentage
  const budgetUsedPercentage = project.totalBudget && project.totalBudget > 0 
    ? Math.min((totalValue / project.totalBudget) * 100, 100) 
    : 0;

  const isOverBudget = totalValue > (project.totalBudget || 0) && (project.totalBudget || 0) > 0;

  // Check if we should show the "Import from Offer" button
  const shouldShowImportButton = 
    (project.totalBudget || 0) === 0 && 
    project.workflow?.offerCreated?.offerId && 
    !isEditing &&
    onImportFromOffer;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 transition-all duration-1000 ${
      budgetUpdateEffect ? 'ring-4 ring-blue-300 ring-opacity-50 shadow-lg scale-105' : ''
    }`}>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Gesamtbudget</h3>
      
      {isEditing ? (
        <input
          type="number"
          value={budget}
          onChange={(e) => onBudgetChange(e.target.value)}
          onBlur={onSave}
          onFocus={(e) => e.target.select()}
          onKeyDown={onKeyDown}
          className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 -mx-1 w-full"
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between">
          <div 
            className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150"
            onClick={onStartEditing}
          >
            {formatCurrency(project.totalBudget || 0)}
          </div>
          
          {shouldShowImportButton && (
            <button
              onClick={onImportFromOffer}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
              title="Budget aus hinterlegtem Angebot übernehmen"
            >
              <Download className="h-4 w-4" />
              Aus Angebot übernehmen
            </button>
          )}
        </div>
      )}
      
      {/* Budget Status Bar - Nur anzeigen wenn Budget > 0 */}
      {(project.totalBudget || 0) > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Verbraucht</span>
            <span>{budgetUsedPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${budgetUsedPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectBudgetCard;