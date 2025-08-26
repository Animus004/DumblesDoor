import React from 'react';

interface EnvVarPromptProps {
    missingKeys: string[];
}

const EnvironmentVariablePrompt: React.FC<EnvVarPromptProps> = ({ missingKeys }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-lg text-left">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuration Required</h2>
        <p className="text-gray-600 mb-2">
          This application requires the following environment variables to be set in your hosting provider's settings (e.g., Vercel).
        </p>
        <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md mb-6">
          <strong>Important:</strong> For security, these variable names must be prefixed with <code className="font-mono bg-yellow-200 px-1 rounded">VITE_</code> to be accessible by the app in the browser.
        </p>
        <ul className="list-disc list-inside bg-gray-100 p-4 rounded-md space-y-2 mb-6">
            {missingKeys.map(key => (
                <li key={key}>
                    <code className="bg-gray-200 text-red-600 font-mono p-1 rounded text-sm">{key}</code>
                </li>
            ))}
        </ul>
        <p className="text-sm text-gray-500">
          The application will start working automatically once these are correctly configured in your project's settings. You may need to trigger a new deployment for the changes to take effect.
        </p>
      </div>
    </div>
  );
};

export default EnvironmentVariablePrompt;