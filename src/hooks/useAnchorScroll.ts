'use client';

import { MouseEvent, useCallback } from 'react';

export const useAnchorScroll = () => {
    const handleScroll = useCallback((e: MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('/#')) {
            e.preventDefault();
            const targetId = href.replace('/#', '');
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', href);
            }
        }
    }, []);

    return handleScroll;
};
