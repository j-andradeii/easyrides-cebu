'use client';

import { useState } from 'react';

interface FacebookMessengerProps {
  pageId: string;
  themeColor?: string;
}

export default function FacebookMessenger({
  pageId,
  themeColor = '#0084FF',
}: FacebookMessengerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // m.me link opens Messenger conversation with the page
  // For mobile compatibility, pageId should be the page USERNAME (not numeric ID)
  // e.g., "EasyRidesOfficial" from facebook.com/EasyRidesOfficial
  const messengerUrl = `https://m.me/${pageId}`;

  return (
    <a
      href={messengerUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 transition-all duration-300"
      aria-label="Chat on Messenger"
    >
      {/* Tooltip */}
      <span
        className={`bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-slate-700 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        Chat with us
      </span>

      {/* Messenger Icon Button */}
      <div
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-110"
        style={{ backgroundColor: themeColor }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="w-7 h-7"
        >
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.04.57.61.94 1.13.71l1.98-.87c.17-.08.36-.1.55-.06.91.25 1.87.38 2.88.38 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.58l-2.88 4.57c-.46.73-1.45.92-2.13.41l-2.29-1.72a.6.6 0 00-.72 0l-3.09 2.34c-.41.31-.95-.18-.68-.62l2.88-4.57c.46-.73 1.45-.92 2.13-.41l2.29 1.72a.6.6 0 00.72 0l3.09-2.34c.41-.31.95.18.68.62z"/>
        </svg>
      </div>
    </a>
  );
}
