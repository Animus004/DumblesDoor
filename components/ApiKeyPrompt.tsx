import React from 'react';

const ApiKeyPrompt: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gemini API Key Required</h2>
        <p className="text-gray-600 mb-6">
          This application requires a Google Gemini API key to function. Please set your API key as the{' '}
          <code className="bg-gray-200 text-red-600 font-mono p-1 rounded">API_KEY</code> environment variable.
        </p>
        <p className="text-sm text-gray-500">
          The application will start working automatically once the environment variable is correctly configured. You might need to restart your development server.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
