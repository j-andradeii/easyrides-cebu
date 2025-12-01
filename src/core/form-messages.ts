/**
 * Form Validation Messages
 *
 * Centralized validation messages for forms
 */

const FORM_MESSAGES = {
  // Required fields
  FIELD_REQUIRED: 'This field is required',

  // Email validation
  EMAIL_REQUIRED: 'Email address is required',
  EMAIL_INVALID: 'Please enter a valid email address',

  // Phone validation
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Please enter a valid phone number',
  PHONE_MIN: 'Phone number must be at least ${min} digits',
  PHONE_MAX: 'Phone number cannot exceed ${max} characters',

  // Name validation
  NAME_REQUIRED: 'Name is required',
  NAME_MIN: 'Name must be at least ${min} characters',
  NAME_MAX: 'Name cannot exceed ${max} characters',

  // Message validation
  MESSAGE_MAX: 'Message cannot exceed ${max} characters',

  // Date validation
  DATE_REQUIRED: 'Please select a date',
  DATE_INVALID: 'Please select a valid date',
  DATE_PAST: 'Date cannot be in the past',

  // Selection validation
  SELECT_REQUIRED: 'Please select an option',

  // Generic
  GENERIC_ERROR: 'Please check this field',
  MIN_LENGTH: 'Must be at least ${min} characters',
  MAX_LENGTH: 'Cannot exceed ${max} characters',
} as const;

export default FORM_MESSAGES;
