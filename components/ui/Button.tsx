import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  isChristmas?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isChristmas = false, 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  let variantStyles = "";

  if (isChristmas) {
    switch (variant) {
      case 'primary':
        variantStyles = "bg-christmas-red hover:bg-red-700 text-white focus:ring-red-500 shadow-md";
        break;
      case 'secondary':
        variantStyles = "bg-christmas-green hover:bg-green-800 text-white focus:ring-green-500";
        break;
      case 'success':
        variantStyles = "bg-christmas-gold hover:bg-yellow-500 text-green-900 focus:ring-yellow-400";
        break;
      case 'danger':
         variantStyles = "bg-gray-800 hover:bg-gray-900 text-white";
         break;
      default:
        variantStyles = "hover:bg-christmas-cream text-christmas-red hover:text-christmas-green";
    }
  } else {
    switch (variant) {
      case 'primary':
        variantStyles = "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm";
        break;
      case 'secondary':
        variantStyles = "bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-gray-500";
        break;
      case 'success':
        variantStyles = "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500";
        break;
      case 'danger':
        variantStyles = "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500";
        break;
      case 'ghost':
        variantStyles = "bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400";
        break;
    }
  }

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
