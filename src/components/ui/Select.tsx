import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-colors
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            bg-white dark:bg-gray-700 dark:text-white
            focus:ring-blue-500 focus:border-blue-500
            ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
