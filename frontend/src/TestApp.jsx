import React from 'react';

const TestApp = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">Test Component</h1>
        <p className="text-gray-700">
          If you can see this, React is working!
        </p>
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          This is a test component to help diagnose the issue.
        </div>
      </div>
    </div>
  );
};

export default TestApp;
