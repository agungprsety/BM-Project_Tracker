import React from 'react';

const LoadingSkeleton = React.memo(({ darkMode }) => (
  <div className="animate-pulse">
    <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className={`h-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
      <div className={`h-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
    </div>
    <div className={`h-64 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;
