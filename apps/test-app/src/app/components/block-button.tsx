import { ComponentProps } from 'react';

export function BlockButton(props: ComponentProps<'button'>) {
  return <button {...props} className={blockButtonClassName(props)} />;
}

export function blockButtonClassName({
  disabled,
  className,
}: Pick<ComponentProps<'button'>, 'disabled' | 'className'> = {}) {
  return `p-4 rounded transition-colors border-2 bg-white text-semibold ${
    disabled
      ? 'text-gray-600 border-gray-600'
      : 'text-sky-600 border-sky-600 hover:border-sky-800 hover:text-sky-800'
  } ${className ?? ''}`;
}
