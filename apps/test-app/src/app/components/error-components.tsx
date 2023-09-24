import { ApiClientException } from '@aedi/browser-client';
import { clientConfig } from '../client-config';
import { ErrorCircleIcon } from './icons/error-circle-icon';

export function ErrorCard(props: { message: string }) {
  return (
    <div className="bg-red-200 text-red-700 p-4 rounded flex gap-4">
      <ErrorCircleIcon />
      <p className="error-message">{props.message}</p>
    </div>
  );
}

export function ErrorFill({ error }: { error: unknown }) {
  return (
    <div className="flex-1 flex justify-center items-center">
      <ErrorCard message={getErrorMessage(error)} />
    </div>
  );
}

/**
 * Used to display a single form-level error message.
 * Displays nothing for validation errors as they will
 * be displayed at the field-level using `FormFieldError`.
 */
export function FormError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }
  if (clientConfig && error instanceof ApiClientException) {
    // Field errors are displayed individually
    if (error.getFieldErrorCount() > 0) {
      return null;
    }
  }

  return <ErrorCard message={getErrorMessage(error)} />;
}

/**
 * Used to display error messages for a single form field.
 */
export function FormFieldError({
  error,
  field,
}: {
  error: unknown;
  field: string;
}) {
  if (!error) {
    return null;
  }
  if (clientConfig && error instanceof ApiClientException) {
    const fieldErrorMessage = error.findErrorAtPath(field);
    if (!fieldErrorMessage) {
      return null;
    }
    return <ErrorCard message={fieldErrorMessage} />;
  }
}

export function getErrorMessage(error: unknown): string {
  // Returns string errors as-is (ideally we don't use string errors)
  if (typeof error === 'string') {
    return error;
  }

  // Get API error messages
  if (error instanceof ApiClientException) {
    return error.data.message;
  }

  // Get plain error message if it exists
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return `Unknown error format.`;
}
