import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface BlurTextProps {
  text: string;
  className?: string;
  variant?: {
    hidden: { filter: string; opacity: number; y: number };
    visible: { filter: string; opacity: number; y: number };
  };
  duration?: number;
  delay?: number;
}

export const BlurText = ({
  text,
  className,
  variant,
  duration = 1,
  delay = 0,
}: BlurTextProps) => {
  const defaultVariants = {
    hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
    visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
  };
  const combinedVariants = variant || defaultVariants;

  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      variants={combinedVariants}
      className={cn("drop-shadow-sm", className)}
    >
      {text}
    </motion.h1>
  );
};
