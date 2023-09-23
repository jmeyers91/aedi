import { clientConfig } from '../client-config';

function ErrorMessage(props: { message: string }) {
  return <p className="text-red-700">{props.message}</p>;
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
  if (clientConfig && error instanceof clientConfig.ApiError) {
    // Validation errors are displayed individually
    if (error.isValidationError()) {
      return null;
    }
  }

  return <ErrorMessage message={(error as Error).message} />;
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
  if (clientConfig && error instanceof clientConfig.ApiError) {
    const fieldErrorMessage = error.findErrorAtPath(
      `/${field.replace(/\./g, '/')}`,
    );
    if (!fieldErrorMessage) {
      return null;
    }
    return <ErrorMessage message={fieldErrorMessage} />;
  }
}
