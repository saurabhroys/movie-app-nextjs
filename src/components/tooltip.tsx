import React from 'react'

export const tooltip = (text:string) => {
  return (
    <div className="relative group inline-block">
        <span
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                     hidden group-hover:block 
                     bg-gray-800 text-white text-sm rounded px-2 py-1 
                     whitespace-nowrap"
        >
          {text}
        </span>
      </div>
  )
}
