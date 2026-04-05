import React from 'react';

const STEP_LABELS = ['Category', 'Photo & Location', 'Details', 'Review'];

export default function StepIndicator({ currentStep, totalSteps = 4 }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
          <div className="h-full bg-primary-600 transition-all duration-500"
               style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }} />
        </div>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum   = i + 1;
          const isDone    = stepNum < currentStep;
          const isActive  = stepNum === currentStep;
          return (
            <div key={stepNum} className="flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${isDone ? 'bg-primary-600 border-primary-600 text-white' : isActive ? 'bg-white border-primary-600 text-primary-600 shadow-md' : 'bg-white border-gray-300 text-gray-400'}`}>
                {isDone ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : stepNum}
              </div>
              <span className={`mt-2 text-xs font-medium hidden sm:block transition-colors ${isActive ? 'text-primary-600' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sm:hidden text-center text-sm font-medium text-primary-600 mt-3">
        Step {currentStep} of {totalSteps} — {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}
