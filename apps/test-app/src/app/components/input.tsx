import { ComponentProps } from 'react';

export function Input(props: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={`p-4 rounded bg-gray-100 ${props.className ?? ''}`}
    />
  );
}
