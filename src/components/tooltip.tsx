import React from 'react';

export const tooltip = (text: string) => {
  return (
    <div className="group relative inline-block">
      <span className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-neutral-800 px-2 py-1 text-sm whitespace-nowrap text-white group-hover:block">
        {text}
      </span>
    </div>
  );
};
