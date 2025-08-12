import React from 'react';

function SettingsTabOverview() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Allgemeine Einstellungen</h3>
          <p className="mt-1 text-sm text-gray-500">
            Grundlegende Einstellungen für Ihr Konto und die Anwendung.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-6">
              <h2 className="text-xl font-medium text-gray-900">Profil</h2>
              <p className="mt-1 text-sm text-gray-500">
                Diese Informationen werden in Ihrem öffentlichen Profil angezeigt.
              </p>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                E-Mail
              </label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="max@beispiel.de"
                disabled
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Sprache
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-6">
              <h2 className="text-xl font-medium text-gray-900">Benachrichtigungen</h2>
              <p className="mt-1 text-sm text-gray-500">
                Wählen Sie aus, wie Sie über wichtige Ereignisse informiert werden möchten.
              </p>
            </div>

            <div className="sm:col-span-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    E-Mail-Benachrichtigungen für neue Aufgaben
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    E-Mail-Benachrichtigungen für Projektänderungen
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    E-Mail-Benachrichtigungen für Kommentare
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="ml-3 rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTabOverview;