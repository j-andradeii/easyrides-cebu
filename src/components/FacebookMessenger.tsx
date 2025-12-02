'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: { xfbml: boolean; version: string }) => void;
      XFBML: {
        parse: () => void;
      };
    };
  }
}

interface FacebookMessengerProps {
  pageId: string;
  themeColor?: string;
  loggedInGreeting?: string;
  loggedOutGreeting?: string;
}

export default function FacebookMessenger({
  pageId,
  themeColor = '#0084FF',
  loggedInGreeting = 'Hi! How can we help you?',
  loggedOutGreeting = 'Hi! How can we help you?',
}: FacebookMessengerProps) {
  useEffect(() => {

    console.log("PAGE_ID", pageId);
    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        xfbml: true,
        version: 'v18.0',
      });
    };

    // Load Facebook SDK script
    (function (d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');

    // Cleanup on unmount
    return () => {
      const fbRoot = document.getElementById('fb-root');
      const fbScript = document.getElementById('facebook-jssdk');
      if (fbScript) fbScript.remove();
      if (fbRoot) fbRoot.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div id="fb-root"></div>
      <div
        className="fb-customerchat"
        data-attribution="setup_tool"
        data-page_id={pageId}
        data-theme_color={themeColor}
        data-logged_in_greeting={loggedInGreeting}
        data-logged_out_greeting={loggedOutGreeting}
      />
    </>
  );
}
