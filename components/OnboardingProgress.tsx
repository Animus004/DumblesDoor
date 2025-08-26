import React from 'react';

export const OnboardingProgress: React.FC<{ currentStep: number; totalSteps: number; }> = ({ currentStep, totalSteps }) => (
    <div className="w-full px-2 sm:px-8 py-4">
        <p className="text-center text-sm font-medium text-gray-600 mb-2">Step {currentStep} of {totalSteps}</p>
        <div className="bg-gray-200 rounded-full h-2">
            <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
        </div>
    </div>
);
