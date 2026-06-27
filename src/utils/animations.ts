import { Variants } from 'framer-motion';

export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" as const }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn" as const }
  }
};

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const }
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.15, ease: "easeIn" as const }
  }
};

export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const }
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.15, ease: "easeIn" as const }
  }
};

export const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
};

export const hoverScaleVariants = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

export const buttonHoverVariants = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { y: 0 },
};

export const dropdownMotion = {
  variants: slideDownVariants,
  initial: "initial",
  animate: "animate",
  exit: "exit",
};

export const modalMotion = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" as const } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" as const } },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
    exit: { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2, ease: "easeIn" as const } },
  }
};
