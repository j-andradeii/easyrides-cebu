/**
 * PhotoGallery Component
 *
 * A grid of photos that opens into a full-screen lightbox — arrow keys and
 * Escape included. Lifted out of `TourGallery` when the fleet pages needed the
 * same thing for vehicle photos; both catalogues now render this, so a fix to
 * the lightbox is a fix in both places.
 *
 * The lightbox walks the photos that are actually on screen. Anything past
 * `maxVisible` is not rendered and not reachable — arrowing into a photo the
 * grid never showed was the old behaviour and it only ever confused.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface PhotoGalleryProps {
    images: string[];
    /** What the photos are of — used for alt text. */
    title: string;
    /** Section heading. Pass `null` to render the grid on its own. */
    heading?: string | null;
    /** How many photos the grid shows. */
    maxVisible?: number;
    /**
     * `cover` fills each tile and crops; `contain` fits the whole photo inside
     * it. Vehicle shots on a plain background want `contain`, scenery wants
     * `cover`.
     */
    fit?: 'cover' | 'contain';
}

export function PhotoGallery({
    images,
    title,
    heading = 'Gallery',
    maxVisible = 8,
    fit = 'cover',
}: PhotoGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const visible = images.slice(0, maxVisible);
    const count = visible.length;

    const openLightbox = (index: number) => setSelectedIndex(index);

    const closeLightbox = useCallback(() => setSelectedIndex(null), []);

    const nextImage = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedIndex((prev) => (prev === null ? null : (prev + 1) % count));
        },
        [count]
    );

    const prevImage = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedIndex((prev) => (prev === null ? null : (prev - 1 + count) % count));
        },
        [count]
    );

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;

            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") {
                setSelectedIndex((prev) => (prev === null ? null : (prev + 1) % count));
            }
            if (e.key === "ArrowLeft") {
                setSelectedIndex((prev) => (prev === null ? null : (prev - 1 + count) % count));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, count, closeLightbox]);

    // The page behind the lightbox must not scroll. Done as an effect rather
    // than inside the open/close handlers so the cleanup runs on unmount too —
    // navigating away with the lightbox open used to leave the next page stuck.
    useEffect(() => {
        if (selectedIndex === null) return;

        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [selectedIndex]);

    if (count === 0) return null;

    return (
        <div>
            {heading && <h2 className="text-2xl font-bold text-slate-900 mb-4">{heading}</h2>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {visible.map((image, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => openLightbox(index)}
                        aria-label={`Open photo ${index + 1} of ${count}`}
                        className={`relative aspect-square rounded-xl overflow-hidden group cursor-pointer ${
                            fit === "contain" ? "bg-white border border-slate-100" : ""
                        }`}
                    >
                        <Image
                            src={image}
                            alt={`${title} Gallery Image ${index + 1}`}
                            fill
                            className={`transition-transform duration-500 group-hover:scale-110 ${
                                fit === "contain" ? "object-contain p-2" : "object-cover"
                            }`}
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                        {/* View Icon on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/50 text-white p-2 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Lightbox Overlay */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        aria-label="Close gallery"
                        className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Previous Button */}
                    <button
                        onClick={prevImage}
                        aria-label="Previous photo"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hidden md:block"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Image Container */}
                    <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={visible[selectedIndex]}
                            alt={`${title} - View ${selectedIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            quality={90}
                            priority
                        />
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={nextImage}
                        aria-label="Next photo"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hidden md:block"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Counter/Caption */}
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                        {selectedIndex + 1} / {count}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhotoGallery;
