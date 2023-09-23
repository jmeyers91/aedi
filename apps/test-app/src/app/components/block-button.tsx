import { ComponentProps } from 'react';

export function BlockButton(props: ComponentProps<'button'>) {
  return <button {...props} className={blockButtonClassName(props)} />;
}

export function blockButtonClassName({
  disabled,
  className,
}: Pick<ComponentProps<'button'>, 'disabled' | 'className'> = {}) {
  return `p-4 rounded-lg  text-white transition-colors ${
    disabled ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
  } ${className ?? ''}`;
}
