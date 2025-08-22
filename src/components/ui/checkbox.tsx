import * as React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, id, className, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type=\"button\"
        role=\"checkbox\"
        aria-checked={checked}
        id={id}
        disabled={disabled}
        onClick={handleClick}
        className={clsx(
          'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          checked 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-background',
          className
        )}
        {...props}
      >
        {checked && (
          <Check className=\"h-3 w-3\" />
        )}
      </button>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };"