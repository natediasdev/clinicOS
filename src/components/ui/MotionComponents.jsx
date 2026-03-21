/**
 * MotionComponents.jsx
 * Componentes reutilizáveis com animação Framer Motion.
 *
 * Exporta:
 *   MotionModal   — sobreposição + card animado
 *   MotionToast   — toast que aparece de baixo
 *   MotionList    — lista com stagger automático
 *   MotionCard    — card com entrada animada
 *   MotionButton  — botão com feedback de pressionar
 */

import { motion, AnimatePresence } from "framer-motion"
import {
  overlayVariants,
  modalVariants,
  toastVariants,
  listVariants,
  itemVariants,
  cardVariants,
  actionVariants,
} from "../../hooks/useMotion"

// ─── MotionModal ──────────────────────────────────────────────────────────────
/**
 * Uso:
 *   <MotionModal open={showModal} onClose={() => setShowModal(false)}>
 *     <div style={{ background: t.bgInset, borderRadius: 16, ... }}>
 *       conteúdo do modal
 *     </div>
 *   </MotionModal>
 */
export function MotionModal({ open, onClose, children, maxWidth = 480 }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 24,
          }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: "100%", maxWidth }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── MotionToast ──────────────────────────────────────────────────────────────
/**
 * Uso:
 *   <MotionToast toast={toast} />
 *   onde toast = { msg: string, type: "success" | "error" } | null
 *
 *   Para usar com useTheme:
 *   function Toast({ toast, t }) {
 *     return (
 *       <MotionToast toast={toast}>
 *         <div style={{ background: toast?.type === "success" ? t.successBg : t.errorBg, ... }}>
 *           {toast?.msg}
 *         </div>
 *       </MotionToast>
 *     )
 *   }
 */
export function MotionToast({ toast, children }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── MotionList ───────────────────────────────────────────────────────────────
/**
 * Container que aplica stagger automático nos filhos.
 *
 * Uso:
 *   <MotionList>
 *     {patients.map(p => (
 *       <MotionItem key={p.id}>
 *         <div>...card...</div>
 *       </MotionItem>
 *     ))}
 *   </MotionList>
 */
export function MotionList({ children, style, className }) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function MotionItem({ children, style, className }) {
  return (
    <motion.div variants={itemVariants} style={style} className={className}>
      {children}
    </motion.div>
  )
}

// ─── MotionCard ───────────────────────────────────────────────────────────────
/**
 * Card com entrada animada individual (sem stagger).
 * Para usar em MetricCards, SectionCards, etc.
 *
 * Uso:
 *   <MotionCard delay={index * 0.05}>
 *     <div style={{ background: t.bgCard, ... }}>...</div>
 *   </MotionCard>
 */
export function MotionCard({ children, delay = 0, style, className }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── MotionButton ─────────────────────────────────────────────────────────────
/**
 * Botão com feedback tátil de pressionar.
 *
 * Uso:
 *   <MotionButton onClick={handleSave} style={{ background: t.accent, ... }}>
 *     Salvar
 *   </MotionButton>
 */
export function MotionButton({ children, onClick, disabled, style, className, type = "button" }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      variants={actionVariants}
      initial="rest"
      whileTap="press"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      style={{ cursor: disabled ? "not-allowed" : "pointer", ...style }}
      className={className}
    >
      {children}
    </motion.button>
  )
}
