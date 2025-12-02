/**
 * TourCard Component
 *
 * Reusable card component for displaying tour packages
 */

import Link from 'next/link';
import Image from 'next/image';
import type { Tour } from '@/types/tour';

interface TourCardProps {
  tour: Tour;
}

export function TourCard({ tour }: TourCardProps) {
  return (
    <Link href={`/tours/${tour.slug}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
        {/* Tour Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-slate-700">
            {tour.duration}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-coral transition-colors">
            {tour.title}
          </h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{tour.shortDescription}</p>

          {/* Starting Price */}
          <div className="flex items-end gap-1 mb-4">
            <span className="text-sm text-slate-500">Starting at</span>
            <span className="text-2xl font-bold text-slate-900">
              ₱{tour.pricing.sedan.price.toLocaleString()}
            </span>
          </div>

          {/* View Details Button */}
          <span className="block w-full text-center py-3 rounded-lg font-semibold bg-slate-100 group-hover:bg-gradient-to-r group-hover:from-coral group-hover:to-mango group-hover:text-white text-slate-700 transition-all">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
