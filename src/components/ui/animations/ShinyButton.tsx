import { motion } from 'framer-motion';

interface ShinyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ShinyButton = ({ children, onClick, className, disabled }: ShinyButtonProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl px-8 py-4 bg-primary text-white font-bold shadow-2xl transition-all hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: 1.5,
          repeatDelay: 3,
          ease: 'linear',
        }}
        className="absolute inset-0 z-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
    </motion.button>
  );
};
