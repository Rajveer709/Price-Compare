import React, { useState } from 'react';

const TestComponent = () => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-gray-200">
        <h1 className="text-4xl font-extrabold text-center text-indigo-600 mb-6">
          Tailwind CSS Test
        </h1>
        
        <div className="space-y-6">
          <p className="text-lg text-gray-700 text-center">
            This is a test component to verify Tailwind CSS is working correctly.
          </p>
          
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-indigo-800 font-medium">
              If you see styled elements below, Tailwind is working!
            </p>
          </div>
          
          <button 
            onClick={() => setClicked(!clicked)}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              clicked 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {clicked ? '✓ Working!' : 'Test Button'}
          </button>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">What to check:</h3>
            <ul className="list-disc list-inside text-green-700 space-y-1">
              <li>Gradient background</li>
              <li>Card with shadow and border</li>
              <li>Styled text and buttons</li>
              <li>Hover effects on the button</li>
              <li>Responsive padding and margins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
