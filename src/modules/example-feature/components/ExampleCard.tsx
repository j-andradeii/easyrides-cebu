/**
 * Example Card Component
 *
 * Feature-specific component example
 * This is a template - customize for your feature
 */

'use client';

import { useExampleData } from '../hooks/useExampleData';

interface ExampleCardProps {
  id?: string;
  className?: string;
}

export function ExampleCard({ id = '1', className = '' }: ExampleCardProps) {
  const { data, isLoading, error } = useExampleData(id);

  if (isLoading) {
    return (
      <div className={`p-6 border rounded-lg ${className}`}>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 border border-red-300 rounded-lg ${className}`}>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 border rounded-lg shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold mb-2">{data?.title || 'Example'}</h3>
      <p className="text-gray-600">{data?.description || 'This is an example feature component.'}</p>
    </div>
  );
}
