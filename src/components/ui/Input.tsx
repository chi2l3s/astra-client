import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, containerClassName, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-text-secondary ml-1 block">
            {label}
          </label>
        )}
        
        <div className="relative group">
          <div className={cn(
            "relative flex items-center transition-all duration-200 rounded-xl overflow-hidden",
            "bg-white/5 border border-transparent",
            isFocused 
              ? "bg-white/10 border-primary/50 ring-2 ring-primary/10" 
              : error 
                ? "bg-red-500/5 border-red-500/50" 
                : "hover:bg-white/10"
          )}>
            {leftIcon && (
              <div className={cn(
                "pl-4 transition-colors duration-200",
                isFocused ? "text-primary" : "text-text-secondary"
              )}>
                {leftIcon}
              </div>
            )}
            
            <input
              type={type}
              className={cn(
                "w-full bg-transparent px-4 py-3 text-white placeholder-text-secondary/40 focus:outline-none transition-colors font-medium",
                leftIcon ? "pl-3" : "",
                rightIcon ? "pr-3" : "",
                className
              )}
              ref={ref}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />

            {rightIcon && (
              <div className="pr-4 text-text-secondary/70">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 ml-1 font-medium"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
