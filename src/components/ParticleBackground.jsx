import { useEffect, useRef } from "react"

/**
 * ParticleBackground
 * Canvas 2D — partículas flutuantes conectadas por linhas.
 * Intensidade: média. Responsivo. Zero dependências.
 *
 * Props:
 *   color    — cor das partículas/linhas (hex ou rgba)
 *   count    — quantidade de partículas (default 60)
 *   speed    — velocidade (default 0.4)
 *   opacity  — opacidade base das linhas (default 0.15)
 *   zIndex   — (default 0)
 */
export default function ParticleBackground({
  color   = "#3b82f6",
  count   = 60,
  speed   = 0.4,
  opacity = 0.15,
  zIndex  = 0,
}) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    // Parse cor para rgb
    let r = 59, g = 130, b = 246
    const hex = color.replace("#","")
    if (hex.length === 6) {
      r = parseInt(hex.slice(0,2),16)
      g = parseInt(hex.slice(2,4),16)
      b = parseInt(hex.slice(4,6),16)
    }

    let W = 0, H = 0, particles = []
    const MAX_DIST = 140

    function resize() {
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }

    function makeParticle() {
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r:  Math.random() * 1.5 + 1,
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: count }, makeParticle)
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // mover
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      })

      // linhas entre partículas próximas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < MAX_DIST) {
            const alpha = opacity * (1 - dist/MAX_DIST)
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // pontos
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 2.5})`
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => { resize() })
    ro.observe(canvas)

    init()
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [color, count, speed, opacity])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        display: "block", pointerEvents: "none",
        zIndex,
      }}
    />
  )
}
