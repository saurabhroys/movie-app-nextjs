'use client';
import React from 'react';
import Loading from '../ui/loading';
import { useRouter } from 'next/navigation';
import { MediaType } from '@/types';

interface EmbedPlayerProps {
  url: string;
  mediaId?: string;
  playerClass?: string;
  mediaType?: MediaType;
  episode?: number;
}

function EmbedPlayer(props: EmbedPlayerProps) {
  const router = useRouter();

  React.useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = props.url;
    }

    const { current } = iframeRef;
    const iframe: HTMLIFrameElement | null = current;
    iframe?.addEventListener('load', handleIframeLoaded);
    return () => {
      iframe?.removeEventListener('load', handleIframeLoaded);
    };
  }, [props.url]);

  const loadingRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleIframeLoaded = () => {
    if (!iframeRef.current) {
      return;
    }
    const iframe: HTMLIFrameElement = iframeRef.current;
    if (iframe) {
      iframe.style.opacity = '1';
      iframe.removeEventListener('load', handleIframeLoaded);
      if (loadingRef.current) loadingRef.current.style.display = 'none';
    }
  };

  return (
    <div
      className={`rounded-xl`}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: '#000',
      }}>
      <div className="group header-top absolute top-20 right-0 left-0 z-2 flex h-fit w-fit items-center justify-between gap-x-5 px-4 md:h-10 md:gap-x-8 md:px-10 lg:h-14">
        <div className="flex flex-1 items-center gap-x-5 md:gap-x-8">
          <svg
            className="h-10 w-10 shrink-0 cursor-pointer transition hover:scale-125"
            stroke="#fff"
            fill="#fff"
            strokeWidth="0"
            viewBox="0 0 16 16"
            height="16px"
            width="16px"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => router.back()}>
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"></path>
          </svg>
        </div>
      </div>
      <div
        ref={loadingRef}
        className="absolute z-1 flex h-full w-full items-center justify-center">
        <Loading />
      </div>
      <iframe
        width="100%"
        className={`${props.playerClass}`}
        height="100%"
        allowFullScreen
        ref={iframeRef}
        style={{ opacity: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default EmbedPlayer;
