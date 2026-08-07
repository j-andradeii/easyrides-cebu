/**
 * TourGallery Component
 *
 * The tour detail page's photo strip. The grid and lightbox live in the shared
 * `PhotoGallery` — this only fixes the tour-shaped defaults, so /tours/[slug]
 * keeps its import and the fleet pages get the same behaviour for free.
 */

"use client";

import { PhotoGallery } from "@/components/PhotoGallery";

interface TourGalleryProps {
    images: string[];
    title: string;
}

export function TourGallery({ images, title }: TourGalleryProps) {
    return <PhotoGallery images={images} title={title} maxVisible={8} fit="cover" />;
}

export default TourGallery;
