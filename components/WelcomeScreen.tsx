
import React from 'react';

const WelcomeScreen: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex flex-col justify-between p-6 md:p-8 text-center overflow-hidden">
      <div className="flex-grow flex flex-col items-center justify-center">
        
        <div className="relative h-40 w-full max-w-sm mb-4">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-40 h-40 bg-teal-200 rounded-full opacity-50"></div>
            {/* Dog Illustration */}
            <svg viewBox="0 0 200 200" className="absolute h-32 w-32 bottom-0 left-1/4 -translate-x-1/2 text-orange-400 fill-current">
              <path d="M121.2,121.3c-1.7-1-3.6-1.6-5.6-1.6c-4.9,0-9,3.8-9.4,8.7c-0.2,2.3,0.6,4.5,2,6.2c-1.3,0.2-2.7,0.4-4,0.4 c-10.2,0-18.4-8.3-18.4-18.4v-11c0-2.4,1.9-4.3,4.3-4.3h11.7c2.4,0,4.3,1.9,4.3,4.3v4.3c0,2.4-1.9,4.3-4.3,4.3h-1.1 c-1.2,0-2.2-1-2.2-2.2v-2.2c0-1.2,1-2.2,2.2-2.2h9.6c1.2,0,2.2,1,2.2,2.2v8.9c0,5.7,4.6,10.2,10.2,10.2c1.7,0,3.4-0.4,4.9-1.2 C122.9,126.9,122.9,123.1,121.2,121.3z M102.3,86.8c-4.8,0-8.7-3.9-8.7-8.7s3.9-8.7,8.7-8.7s8.7,3.9,8.7,8.7S107,86.8,102.3,86.8z" />
            </svg>
            {/* Cat Illustration */}
            <svg viewBox="0 0 200 200" className="absolute h-28 w-28 bottom-0 right-1/4 translate-x-1/2 text-gray-600 fill-current">
              <path d="M129,91.8c-1.4,0-2.8,0.3-4.1,0.8c-1.1,0.4-2.3,0.1-3.1-0.7c-0.8-0.9-1-2.1-0.5-3.2c1.4-3,2.2-6.3,2.2-9.7 c0-11.5-9.4-20.9-20.9-20.9s-20.9,9.4-20.9,20.9c0,3.5,0.8,6.8,2.2,9.7c0.5,1.1,0.3,2.4-0.5,3.2c-0.8,0.9-2.1,1.1-3.1,0.7 c-1.3-0.5-2.7-0.8-4.1-0.8c-5.7,0-10.8,2.3-14.5,6c-0.8,0.8-0.8,2.2,0,3c0.8,0.8,2.2,0.8,3,0c3-3,6.8-4.8,11.5-4.8 c1.2,0,2.4,0.2,3.5,0.5l-3.3,3.3c-1.4,1.4-1.4,3.6,0,5c1.4,1.4,3.6,1.4,5,0l3.3-3.3c1,1.1,2.2,2,3.5,2.7v5.5 c0,1.9,1.6,3.5,3.5,3.5s3.5-1.6,3.5-3.5v-5.5c1.3-0.6,2.5-1.6,3.5-2.7l3.3,3.3c1.4,1.4,3.6,1.4,5,0c1.4-1.4,1.4-3.6,0-5l-3.3-3.3 c1.1-0.3,2.3-0.5,3.5-0.5c4.7,0,8.5,1.8,11.5,4.8c0.8,0.8,2.2,0.8,3,0c0.8-0.8,0.8-2.2,0-3C139.8,94.1,134.7,91.8,129,91.8z" />
            </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mt-4">Welcome to Dumble's Door</h1>
        <p className="text-gray-600 mt-2 max-w-sm">The all-in-one app for your pet's health and happiness in India.</p>

        <div className="mt-10 space-y-5 text-left max-w-xs mx-auto">
          <div className="flex items-start space-x-4">
            <div className="bg-teal-500 text-white rounded-full p-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Health Scans</h3>
              <p className="text-sm text-gray-600">Get quick insights into your pet's well-being from a photo.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-teal-500 text-white rounded-full p-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Your Pet's Digital Log</h3>
              <p className="text-sm text-gray-600">Track memories, appointments, and health checks in one place.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-md mx-auto pt-8">
        <button
          onClick={onGetStarted}
          className="w-full bg-teal-500 text-white font-bold py-4 px-4 rounded-xl hover:bg-teal-600 transition-all transform hover:scale-105 shadow-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
