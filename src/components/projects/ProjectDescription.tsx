import React from 'react';

interface ProjectDescriptionProps {
  description: string;
  isEditing: boolean;
  isUpdating: boolean;
  onDescriptionChange: (description: string) => void;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function ProjectDescription({
  description,
  isEditing,
  isUpdating,
  onDescriptionChange,
  onStartEditing,
  onSave,
  onCancel,
  onKeyDown
}: ProjectDescriptionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Projektbeschreibung</h3>
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={(e) => e.target.select()}
            className="w-full h-32 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Worum geht es in diesem Projekt?"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              disabled={isUpdating}
            >
              Abbrechen
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={isUpdating}
            >
              {isUpdating ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={onStartEditing}
          className="min-h-[32px] text-gray-600 cursor-text hover:text-gray-800 transition-colors duration-150"
        >
          {description || 'Worum geht es in diesem Projekt?'}
        </div>
      )}
    </div>
  );
}

export default ProjectDescription;