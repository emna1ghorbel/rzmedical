import React from "react";

export default function AvoirsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Avoirs Clients
        </h2>
      </div>

      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="mb-4 text-brand-500">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Bientôt disponible</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          La gestion des avoirs clients est en cours de développement et sera disponible dans une prochaine mise à jour de votre espace RZMedical.
        </p>
      </div>
    </div>
  );
}
