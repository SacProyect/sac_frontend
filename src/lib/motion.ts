/**
 * Reusable framer-motion animation presets.
 *
 * Every function accepts a `reducedMotion` boolean so callers can respect the
 * user's `prefers-reduced-motion` preference (or any other motion-reduction
 * signal) without duplicating animation logic at every call-site.
 *
 * The returned objects are plain props that can be spread directly onto
 * framer-motion components (`<motion.div {...fadeInSection(reduced)} />`).
 */

export type MotionPreset = {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  variants?: Record<string, any>;
};

/**
 * Section entrance — a subtle upward fade-in.
 *
 * Use on any content block that should animate into view once (e.g. page
 * sections, card groups, detail panels).
 *
 * @example
 * ```tsx
 * <motion.section {...fadeInSection(isReduced)}>
 *   <h2>Title</h2>
 * </motion.section>
 * ```
 */
export function fadeInSection(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.18, ease: "easeOut" },
    };
}

/**
 * Stagger container — defines the stagger timing for child elements.
 *
 * Spread onto a parent that wraps multiple `staggerItem` children.
 * When `reducedMotion` is true, all children appear simultaneously (no stagger).
 *
 * @example
 * ```tsx
 * <motion.div {...staggerContainer(isReduced)}>
 *   {items.map((item) => (
 *     <motion.div key={item.id} {...staggerItem(isReduced)}>
 *       {item.label}
 *     </motion.div>
 *   ))}
 * </motion.div>
 * ```
 */
export function staggerContainer(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: {},
      animate: { transition: { staggerChildren: 0 } },
    };
  }

  return {
    initial: {},
    animate: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
  };
}

/**
 * Stagger item — each child inside a `staggerContainer`.
 *
 * A lightweight upward fade-in that plays in sequence after the parent's
 * stagger delay. When `reducedMotion` is true the item renders instantly
 * at full opacity.
 *
 * @example
 * ```tsx
 * <motion.div key={id} {...staggerItem(isReduced)}>
 *   <Card />
 * </motion.div>
 * ```
 */
export function staggerItem(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.16, ease: "easeOut" },
  };
}

/**
 * Cross-fade — content switching inside an `AnimatePresence`.
 *
 * Designed for tab panels, route transitions, or any place where one piece of
 * content replaces another. Provides initial, animate, and exit values so the
 * outgoing element fades up-and-out while the incoming one fades up-and-in.
 *
 * When `reducedMotion` is true the translate is removed; only a quick opacity
 * cross-fade remains.
 *
 * @example
 * ```tsx
 * <AnimatePresence mode="wait">
 *   <motion.div key={activeTab} {...crossFade(isReduced)}>
 *     {tabContent}
 *   </motion.div>
 * </AnimatePresence>
 * ```
 */
export function crossFade(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.15, ease: "easeOut" },
    };
  }

  return {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.2, ease: "easeOut" },
  };
}

/**
 * Banner enter / exit — attention-grabbing slide for error and success banners.
 *
 * Banners drop in from above and slide back out the same way. With
 * `reducedMotion` only an opacity fade is used (no vertical translate).
 *
 * @example
 * ```tsx
 * <AnimatePresence>
 *   {error && (
 *     <motion.div key="error" {...bannerEnter(isReduced)}>
 *       <Alert type="error">{error}</Alert>
 *     </motion.div>
 *   )}
 * </AnimatePresence>
 * ```
 */
export function bannerEnter(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.15, ease: "easeOut" },
    };
  }

  return {
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.15, ease: "easeOut" },
  };
}
