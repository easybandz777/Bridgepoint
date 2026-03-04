'use client';

import { motion, type Variants, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps extends HTMLMotionProps<"div"> {
  /** Animation direction */
  direction?: 'up' | 'left' | 'right' | 'none';
  /** Delay in seconds */
  delay?: number;
}

const VARIANTS: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  none: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function AnimatedSection({
  direction = 'up',
  delay = 0,
  className,
  children,
  ...props
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      variants={VARIANTS[direction]}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
