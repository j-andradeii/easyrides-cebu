/**
 * Example Login Form
 *
 * Template showing how to use Zod + react-hook-form with form components
 * This is a reference implementation - customize as needed
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/models/validation-schemas';
import { FormInput } from './FormInput';

interface ExampleLoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>;
}

export function ExampleLoginForm({ onSubmit }: ExampleLoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Login</h2>

      <FormInput
        {...register('email')}
        id="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        error={errors.email}
      />

      <FormInput
        {...register('password')}
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        error={errors.password}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md
                   hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
