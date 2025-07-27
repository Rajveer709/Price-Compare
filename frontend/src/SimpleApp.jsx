import React from 'react';

const SimpleApp = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">Simple App Test</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700">
            This is a simplified version of the App component.
          </p>
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
            If you can see this, the basic App component structure is working.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;
