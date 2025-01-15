import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500">
        <div className="h-full w-full rounded-full border-t-2 border-b-2 border-indigo-700 rotate-45"></div>
      </div>
    </div>
  );
}; 