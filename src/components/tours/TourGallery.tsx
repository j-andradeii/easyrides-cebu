"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface TourGalleryProps {
    images: string[];
    title: string;
}

export function TourGallery({ images, title }: TourGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => {
        setSelectedIndex(index);
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = useCallback(() => {
        setSelectedIndex(null);
        document.body.style.overflow = "unset";
    }, []);

    const nextImage = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (selectedIndex !== null) {
                setSelectedIndex((prev) =>
                    prev === null ? null : (prev + 1) % images.length
                );
            }
        },
        [images.length, selectedIndex]
    );

    const prevImage = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (selectedIndex !== null) {
                setSelectedIndex((prev) =>
                    prev === null ? null : (prev - 1 + images.length) % images.length
                );
            }
        },
        [images.length, selectedIndex]
    );

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;

            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") {
                setSelectedIndex((prev) => (prev! + 1) % images.length);
            }
            if (e.key === "ArrowLeft") {
                setSelectedIndex((prev) => (prev! - 1 + images.length) % images.length);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, images.length, closeLightbox]);

    if (!images || images.length === 0) return null;

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.slice(0, 8).map((image, index) => (
                    <div
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                    >
                        <Image
                            src={image}
                            alt={`${title} Gallery Image ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
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
                    </div>
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
                        className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Previous Button */}
                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hidden md:block"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Image Container */}
                    <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={images[selectedIndex]}
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hidden md:block"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Counter/Caption */}
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                        {selectedIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
}
