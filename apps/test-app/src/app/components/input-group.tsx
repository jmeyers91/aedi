import { ComponentProps } from 'react';
import { Input } from './input';
import { FormFieldError } from './error-components';

export function InputGroup({
  className,
  name,
  label,
  required,
  type,
  value,
  defaultValue,
  placeholder = label,
  disabled,
  error,
  onChange,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: ComponentProps<typeof Input>['type'];
  value?: ComponentProps<typeof Input>['value'];
  defaultValue?: ComponentProps<typeof Input>['defaultValue'];
  placeholder?: ComponentProps<typeof Input>['placeholder'];
  disabled?: ComponentProps<typeof Input>['disabled'];
  error?: unknown;
  onChange?: ComponentProps<typeof Input>['onChange'];
} & Omit<ComponentProps<'div'>, 'onChange'>) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        className="p-4 rounded bg-gray-100 outline-sky-500"
      />
      <FormFieldError error={error} field={name} />
    </div>
  );
}
