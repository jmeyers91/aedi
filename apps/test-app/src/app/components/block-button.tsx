import { ComponentProps } from 'react';

export function BlockButton(props: ComponentProps<'button'>) {
  return <button {...props} className={blockButtonClassName(props)} />;
}

export function blockButtonClassName({
  disabled,
  className,
}: Pick<ComponentProps<'button'>, 'disabled' | 'className'> = {}) {
  return `p-4 rounded transition-all border-2 bg-white text-semibold ${
    disabled
      ? 'text-gray-600 border-gray-600'
      : 'text-sky-500 border-sky-500 hover:border-sky-600 hover:text-sky-700 hover:scale-[1.01]'
  } ${className ?? ''}`;
}
