'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icons } from '@/components/icons';
import Loading from '@/components/ui/loading';

export default function DownloadPage() {
  const router = useRouter();
  const params = useParams();
  const mediaType = params.mediaType as string;
  const mediaId = params.mediaId as string;

  const [isLoading, setIsLoading] = React.useState(true);

  if (!mediaType || !mediaId) {
    return null;
  }

  const downloadUrl = `https://z.zxcstream.xyz/download/${mediaType}/${mediaId}`;

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col items-center">
      {/* Header with Back Button */}
      <div className="w-full max-w-7xl px-4 py-4 flex items-center justify-between border-b border-neutral-800">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-semibold"
        >
          <Icons.chevronLeft className="h-5 w-5" />
          <span>Back to Watch</span>
        </button>
        <span className="text-sm font-medium text-neutral-400">
          Download HD Quality
        </span>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Embedded Iframe Container */}
      <div className="relative w-full max-w-7xl flex-1 min-h-[85vh] mt-4 px-4 pb-6">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <Loading />
          </div>
        )}
        <iframe
          src={downloadUrl}
          width="100%"
          height="100%"
          className="w-full min-h-[80vh] rounded-xl border border-neutral-800 bg-[#0d0d0d] shadow-2xl"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          referrerPolicy="no-referrer-when-downgrade"
          // sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
        />
      </div>
    </div>
  );
}
