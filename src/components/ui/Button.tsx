import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover border-transparent shadow-lg shadow-primary/20",
      secondary: "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20",
      outline: "bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/5",
      ghost: "bg-transparent text-text-secondary hover:text-white hover:bg-white/5 border-transparent",
      danger: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg",
      md: "h-10 px-4 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-2xl",
      icon: "h-10 w-10 p-0 rounded-xl flex items-center justify-center",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-colors border backdrop-blur-sm select-none",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className={cn("mr-2", children ? "" : "mr-0")}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={cn("ml-2", children ? "" : "ml-0")}>{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
