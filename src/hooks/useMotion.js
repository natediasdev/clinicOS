/**
 * useMotion.js
 * Variantes Framer Motion centralizadas para o ClinicOS.
 *
 * Uso:
 *   import { pageVariants, cardVariants, modalVariants, listVariants, itemVariants } from "../../hooks/useMotion"
 *   import { motion, AnimatePresence } from "framer-motion"
 *
 *   // Página
 *   <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit">
 *
 *   // Lista com stagger
 *   <motion.ul variants={listVariants} initial="hidden" animate="visible">
 *     {items.map(item => (
 *       <motion.li key={item.id} variants={itemVariants}>...</motion.li>
 *     ))}
 *   </motion.ul>
 *
 *   // Modal
 *   <AnimatePresence>
 *     {open && (
 *       <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="hidden">
 *         <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
 *           ...
 *         </motion.div>
 *       </motion.div>
 *     )}
 *   </AnimatePresence>
 */

// ─── Transição padrão ─────────────────────────────────────────────────────────
// spring suave para mount, tween rápido para exit
const spring = { type: "spring", stiffness: 380, damping: 30 }
const tween  = { type: "tween",  duration: 0.18, ease: "easeIn" }

// ─── Página ───────────────────────────────────────────────────────────────────
// Entrada: fade + slide de 10px para cima
// Saída: fade rápida sem slide (menos distração ao navegar)
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0, transition: { ...spring, duration: 0.28 } },
  exit:    { opacity: 0, y: -6, transition: tween },
}

// ─── Card / seção ─────────────────────────────────────────────────────────────
// Para MetricCards, SectionCards, cards de lista
export const cardVariants = {
  hidden:  { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: spring,
  },
}

// ─── Lista com stagger ────────────────────────────────────────────────────────
// Container que propaga stagger para os filhos
export const listVariants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren:  0.05,   // 50ms entre cada item
      delayChildren:    0.05,   // pequeno delay inicial
    },
  },
}

// Item individual da lista (filho de listVariants)
export const itemVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring },
}

// ─── Modal ────────────────────────────────────────────────────────────────────
// Overlay (fundo escuro)
export const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

// Card do modal
export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: spring },
  exit:    { opacity: 0, scale: 0.96, y: 8, transition: tween },
}

// ─── Feedback de ação ─────────────────────────────────────────────────────────
// Botão — pressionar para confirmar ação
export const actionVariants = {
  rest:  { scale: 1 },
  press: { scale: 0.95, transition: { duration: 0.1 } },
}

// Toast — aparece de baixo, some para baixo
export const toastVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: spring },
  exit:    { opacity: 0, y: 16, scale: 0.96, transition: tween },
}
