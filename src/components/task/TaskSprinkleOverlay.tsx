import { memo, useEffect, useRef } from "react";
import type { Priority } from "../../core/types";
import { useSprinkleStore } from "../../store/sprinkle-store";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  type: "star" | "diamond" | "dot";
  primaryColor: string;
  sparkleColor: string;
  glowColor: string;
  alpha: number;
  age: number;
}

interface Bloom {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface Palette {
  primary: string;
  highlight: string;
  sparkle: string;
  glow: string;
}

const PRIORITY_PALETTES: Record<Priority, Palette> = {
  high: {
    primary: "#f43f5e",
    highlight: "#fb7185",
    sparkle: "#ffe4e6",
    glow: "rgba(244, 63, 94, 0.45)",
  },
  medium: {
    primary: "#f59e0b",
    highlight: "#fbbf24",
    sparkle: "#fef9c3",
    glow: "rgba(245, 158, 11, 0.45)",
  },
  low: {
    primary: "#38bdf8",
    highlight: "#60a5fa",
    sparkle: "#e0f2fe",
    glow: "rgba(56, 189, 248, 0.45)",
  },
};

function getDefaultPalette(isDark: boolean): Palette {
  return isDark
    ? {
        primary: "#d4d4d8",
        highlight: "#f4f4f5",
        sparkle: "#ffffff",
        glow: "rgba(255, 255, 255, 0.35)",
      }
    : {
        primary: "#71717a",
        highlight: "#a1a1aa",
        sparkle: "#f4f4f5",
        glow: "rgba(113, 113, 122, 0.35)",
      };
}

function drawHeroStar(
  ctx: CanvasRenderingContext2D,
  size: number,
  primaryColor: string,
  sparkleColor: string,
) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.closePath();
  ctx.fillStyle = primaryColor;
  ctx.fill();

  const inner = size * 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -inner);
  ctx.lineTo(inner, 0);
  ctx.lineTo(0, inner);
  ctx.lineTo(-inner, 0);
  ctx.closePath();
  ctx.fillStyle = sparkleColor;
  ctx.fill();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.7, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function TaskSprinkleOverlayComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const bloomsRef = useRef<Bloom[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Sync canvas dimensions to viewport once and on resize only (prevents rAF layout thrashing & context resets)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useSprinkleStore.subscribe((state) => {
      const burst = state.latestBurst;
      if (!burst) return;

      const isDark = document.documentElement.classList.contains("dark");
      const palette = burst.priority
        ? PRIORITY_PALETTES[burst.priority]
        : getDefaultPalette(isDark);

      // 1. Subtle central optical bloom
      bloomsRef.current.push({
        x: burst.x,
        y: burst.y,
        radius: 4,
        maxRadius: 18,
        color: palette.glow,
        alpha: 0.4,
      });

      // 2. High-precision stardust particles (hierarchy of stars, diamonds, pearls)
      const count = 9;
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const baseAngle = (i / count) * Math.PI * 2;
        const angle = baseAngle + (Math.random() - 0.5) * 0.4;
        const isHero = i % 4 === 0;
        const isDiamond = i % 4 === 2;
        const speed = isHero
          ? 3.2 + Math.random() * 1.2
          : isDiamond
            ? 2.5 + Math.random() * 1.0
            : 1.8 + Math.random() * 1.0;

        newParticles.push({
          x: burst.x,
          y: burst.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.14,
          size: isHero ? 4.8 : isDiamond ? 2.6 : 1.6,
          type: isHero ? "star" : isDiamond ? "diamond" : "dot",
          primaryColor: isHero
            ? palette.primary
            : isDiamond
              ? palette.highlight
              : palette.primary,
          sparkleColor: palette.sparkle,
          glowColor: palette.glow,
          alpha: 1,
          age: 0,
        });
      }

      particlesRef.current.push(...newParticles);

      if (!animFrameRef.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
          const particles = particlesRef.current;
          const blooms = bloomsRef.current;

          if (particles.length === 0 && blooms.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animFrameRef.current = null;
            return;
          }

          const dpr = window.devicePixelRatio || 1;
          const displayWidth = window.innerWidth;
          const displayHeight = window.innerHeight;

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, displayWidth, displayHeight);

          // 1. Render blooms
          for (let i = blooms.length - 1; i >= 0; i--) {
            const b = blooms[i];
            if (!b) continue;

            b.radius += (b.maxRadius - b.radius) * 0.16;
            b.alpha *= 0.88;

            if (b.alpha <= 0.01) {
              blooms.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, b.alpha);
            const grad = ctx.createRadialGradient(
              b.x,
              b.y,
              0,
              b.x,
              b.y,
              b.radius,
            );
            grad.addColorStop(0, b.color);
            grad.addColorStop(0.4, b.color);
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 2. Render particles
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            if (!p) continue;

            p.age += 1;
            p.x += p.vx;
            p.y += p.vy;

            // Fluid drag + subtle gravity
            p.vx *= 0.915;
            p.vy *= 0.915;
            p.vy += 0.06;
            p.rotation += p.spin;

            // Crisp initial visibility, followed by smooth dissolve
            if (p.age > 14) {
              p.alpha *= 0.88;
            }

            if (p.alpha <= 0.01) {
              particles.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, p.alpha);

            // Subtle optical glow
            ctx.shadowColor = p.glowColor;
            ctx.shadowBlur = p.type === "star" ? 4 : 2;

            if (p.type === "star") {
              drawHeroStar(ctx, p.size, p.primaryColor, p.sparkleColor);
            } else if (p.type === "diamond") {
              drawDiamond(ctx, p.size, p.primaryColor);
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fillStyle = p.primaryColor;
              ctx.fill();
            }

            ctx.restore();
          }

          ctx.restore();
          animFrameRef.current = requestAnimationFrame(render);
        };

        animFrameRef.current = requestAnimationFrame(render);
      }
    });

    return () => {
      unsubscribe();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 w-full h-full z-50"
    />
  );
}

export const TaskSprinkleOverlay = memo(TaskSprinkleOverlayComponent);
