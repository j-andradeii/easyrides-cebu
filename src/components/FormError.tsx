/**
 * FormError Component
 *
 * Displays validation error messages for form fields
 */

'use client';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <small className={`text-cebu-red text-sm mt-1 block ${className}`}>
      {error}
    </small>
  );
};

export default FormError;
