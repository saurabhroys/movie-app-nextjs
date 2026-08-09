'use client';

import React, { useState } from 'react';
import { Icons } from '@/components/icons';

interface DownloadButtonProps {
  mediaId: string;
  mediaType: string;
  zxcOnline: boolean | null;
}

const DownloadButton = ({ mediaId, mediaType, zxcOnline }: DownloadButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  if (zxcOnline === false || mediaType === 'anime') {
    return null;
  }

  return (
    <>
      <div className="relative mt-4 mb-2 flex justify-center">
        <button
          onClick={() => {
            setIsIframeLoading(true);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-zinc-900/60 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:border-white/25 hover:bg-zinc-800/80 active:scale-95 cursor-pointer"
          title="Download Movie/Show"
        >
          <Icons.download className="h-5 w-5" />
          <span>Download HD</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-200">
          {/* Backdrop closer */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsOpen(false)} />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-5xl h-[85vh] bg-[#0c0c0c] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="w-full px-5 py-4 flex items-center justify-between border-b border-neutral-800/60 bg-neutral-900/30">
              <div className="flex items-center gap-2">
                <Icons.download className="h-5 w-5 text-red-600" />
                <span className="text-sm font-bold text-neutral-200">
                  Download HD Quality
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <Icons.close className="h-5 w-5" />
              </button>
            </div>

            {/* Iframe */}
            <div className="flex-1 w-full bg-black relative">
              {isIframeLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0c0c0c]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
                    <span className="text-xs text-neutral-400 font-medium">Loading download links...</span>
                  </div>
                </div>
              )}
              <iframe
                src={`https://z.zxcstream.xyz/download/${mediaType}/${mediaId}`}
                width="100%"
                height="100%"
                className="w-full h-full border-none"
                allowFullScreen
                onLoad={() => setIsIframeLoading(false)}
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadButton;
