import React, { useRef, useEffect } from 'react';
import { AppleItem, PortalPair, ActiveGameEvent, SnakeAIDebugInfo } from '../types';
import { GRID_COLS, GRID_ROWS, APPLE_DEFINITIONS } from '../constants';
import { Point } from '../engine/SnakeAI';

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface SnakeCanvasProps {
  snake: {
    head: Point;
    body: Point[];
    direction: Point;
  };
  apples: AppleItem[];
  portals: PortalPair[];
  activeEvent: ActiveGameEvent | null;
  aiDebug: SnakeAIDebugInfo;
  showAiVision: boolean;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  snake,
  apples,
  portals,
  activeEvent,
  aiDebug,
  showAiVision,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SparkParticle[]>([]);
  const prevApplesCountRef = useRef(apples.length);

  // Keep state synced via ref so the rendering loop runs smoothly without recreating RAF
  const stateRef = useRef({
    snake,
    apples,
    portals,
    activeEvent,
    aiDebug,
    showAiVision,
  });

  useEffect(() => {
    stateRef.current = {
      snake,
      apples,
      portals,
      activeEvent,
      aiDebug,
      showAiVision,
    };

    // Detect newly collected apple to trigger spark burst
    if (apples.length < prevApplesCountRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const width = canvas.width || 800;
      const height = canvas.height || 600;
      const headPxX = ((snake.head.x + 0.5) * width) / GRID_COLS;
      const headPxY = ((snake.head.y + 0.5) * height) / GRID_ROWS;

      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particlesRef.current.push({
          x: headPxX,
          y: headPxY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: activeEvent?.type === 'turbo' ? '#38bdf8' : '#34d399',
          size: 2 + Math.random() * 3,
          alpha: 1,
          life: 25,
        });
      }
    }
    prevApplesCountRef.current = apples.length;
  }, [snake, apples, portals, activeEvent, aiDebug, showAiVision]);

  // Main Render Loop (runs continuously with zero leak)
  useEffect(() => {
    let animId: number;
    let time = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      if (width <= 10 || height <= 10) {
        animId = requestAnimationFrame(render);
        return;
      }

      const {
        snake: currentSnake,
        apples: currentApples,
        portals: currentPortals,
        activeEvent: currentEvent,
        aiDebug: currentAiDebug,
        showAiVision: currentShowAiVision,
      } = stateRef.current;

      time += 0.04;
      const cellW = width / GRID_COLS;
      const cellH = height / GRID_ROWS;

      ctx.clearRect(0, 0, width, height);

      // 1. Dark Futuristic Grid Arena Background
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, 0, width, height);

      // Subtle Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= GRID_COLS; c += 2) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, height);
        ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r += 2) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(width, r * cellH);
        ctx.stroke();
      }

      // Arena Outer Neon Boundary
      ctx.strokeStyle =
        currentEvent?.type === 'turbo'
          ? 'rgba(56, 189, 248, 0.6)'
          : currentEvent?.type === 'double'
          ? 'rgba(251, 146, 60, 0.6)'
          : 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      // 2. Portals (when active)
      for (const portal of currentPortals) {
        const renderPortal = (pos: Point, hue: number) => {
          const px = (pos.x + 0.5) * cellW;
          const py = (pos.y + 0.5) * cellH;
          const radius = Math.max(4, cellW * (1.1 + Math.sin(time * 3) * 0.15));

          const gradRadius = Math.max(radius * 1.5, 5);
          const grad = ctx.createRadialGradient(px, py, 1, px, py, gradRadius);
          grad.addColorStop(0, `hsla(${hue}, 90%, 65%, 0.9)`);
          grad.addColorStop(0.6, `hsla(${hue}, 90%, 50%, 0.4)`);
          grad.addColorStop(1, `hsla(${hue}, 90%, 40%, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, gradRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(time * 2);
          ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, Math.max(2, radius * 0.45), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        };

        renderPortal(portal.portalA, 280); // Purple Portal
        renderPortal(portal.portalB, 190); // Cyan Portal
      }

      // 3. AI Vision Layer (Debug Path Line)
      if (currentShowAiVision && currentAiDebug.targetApple) {
        const hx = (currentSnake.head.x + 0.5) * cellW;
        const hy = (currentSnake.head.y + 0.5) * cellH;
        const ax = (currentAiDebug.targetApple.x + 0.5) * cellW;
        const ay = (currentAiDebug.targetApple.y + 0.5) * cellH;

        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.restore();

        // Target marker circle
        const targetRadius = Math.max(3, cellW * 0.9 + Math.sin(time * 4) * 2);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ax, ay, targetRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Render Apples
      for (const apple of currentApples) {
        const ax = (apple.x + 0.5) * cellW;
        const ay = (apple.y + 0.5) * cellH;
        const def = APPLE_DEFINITIONS[apple.type] || APPLE_DEFINITIONS.normal;
        const bob = Math.sin(time * 3 + apple.x * 0.5) * 1.8;
        const baseRadius = Math.max(3, cellW * 0.38);

        // Apple Glow
        const glowRadius = Math.max(baseRadius * 1.8, 5);
        const appleGrad = ctx.createRadialGradient(ax, ay + bob, 1, ax, ay + bob, glowRadius);
        appleGrad.addColorStop(0, def.color);
        appleGrad.addColorStop(0.5, def.glowColor);
        appleGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = appleGrad;
        ctx.beginPath();
        ctx.arc(ax, ay + bob, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Apple Solid Body
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(ax, ay + bob, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(ax - baseRadius * 0.35, ay + bob - baseRadius * 0.35, Math.max(1, baseRadius * 0.32), 0, Math.PI * 2);
        ctx.fill();

        // Icon or Value label for rare/golden items
        if (apple.value >= 5) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`+${apple.value}`, ax, ay + bob + baseRadius + 7);
        }
      }

      // 5. Render Snake Body Segments (Tapering & Connected)
      const allSegments = [currentSnake.head, ...currentSnake.body];
      const totalLen = allSegments.length;

      for (let i = totalLen - 1; i >= 1; i--) {
        const seg = allSegments[i];
        const sx = (seg.x + 0.5) * cellW;
        const sy = (seg.y + 0.5) * cellH;

        // Radius tapers towards tail
        const progress = i / totalLen;
        const radius = Math.max(3, cellW * (0.42 - progress * 0.16));

        // Body Color Gradient & Event Themes
        let bodyColor = `hsl(${155 - progress * 40}, 85%, ${50 + Math.sin(time * 2 + i * 0.2) * 5}%)`;
        if (currentEvent?.type === 'turbo') {
          bodyColor = `hsl(${195 + Math.sin(time * 4 + i) * 20}, 95%, 55%)`;
        } else if (currentEvent?.type === 'double') {
          bodyColor = `hsl(${25 + Math.sin(time * 3 + i) * 15}, 95%, 55%)`;
        }

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner soft core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1.5, radius * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Render Snake Head
      const hx = (currentSnake.head.x + 0.5) * cellW;
      const hy = (currentSnake.head.y + 0.5) * cellH;
      const headRadius = Math.max(4, cellW * 0.48);

      // Head Glowing Aura
      const auraRadius = Math.max(headRadius * 1.6, 6);
      const headGrad = ctx.createRadialGradient(hx, hy, 1, hx, hy, auraRadius);
      headGrad.addColorStop(
        0,
        currentEvent?.type === 'turbo'
          ? 'rgba(56, 189, 248, 0.9)'
          : 'rgba(52, 211, 153, 0.9)'
      );
      headGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Head Solid
      ctx.fillStyle = currentEvent?.type === 'turbo' ? '#38bdf8' : '#10b981';
      ctx.beginPath();
      ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Expressive Eyes oriented with direction
      const dirX = currentSnake.direction.x || 1;
      const dirY = currentSnake.direction.y || 0;
      const perpX = -dirY;
      const perpY = dirX;

      const eyeOffsetForward = headRadius * 0.35;
      const eyeOffsetSide = headRadius * 0.45;
      const eyeRadius = Math.max(2, headRadius * 0.32);
      const pupilRadius = Math.max(1, eyeRadius * 0.55);

      const eye1X = hx + dirX * eyeOffsetForward + perpX * eyeOffsetSide;
      const eye1Y = hy + dirY * eyeOffsetForward + perpY * eyeOffsetSide;
      const eye2X = hx + dirX * eyeOffsetForward - perpX * eyeOffsetSide;
      const eye2Y = hy + dirY * eyeOffsetForward - perpY * eyeOffsetSide;

      // White of eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Black pupils looking ahead
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(eye1X + dirX * 1.5, eye1Y + dirY * 1.5, pupilRadius, 0, Math.PI * 2);
      ctx.arc(eye2X + dirX * 1.5, eye2Y + dirY * 1.5, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      // Eye glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eye1X + dirX * 1.2 - 0.8, eye1Y + dirY * 1.2 - 0.8, Math.max(0.5, pupilRadius * 0.45), 0, Math.PI * 2);
      ctx.arc(eye2X + dirX * 1.2 - 0.8, eye2Y + dirY * 1.2 - 0.8, Math.max(0.5, pupilRadius * 0.45), 0, Math.PI * 2);
      ctx.fill();

      // 7. Render Particle Effects
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        p.life -= 1;

        if (p.alpha <= 0 || p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Safe ResizeObserver ensuring canvas pixel resolution matches container
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const targetWidth = rect.width > 0 ? rect.width : 800;
      const targetHeight = rect.height > 0 ? rect.height : 600;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const newWidth = Math.floor(targetWidth * dpr);
      const newHeight = Math.floor(targetHeight * dpr);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    };

    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="snake-canvas-container"
      className="relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        id="snake-live-canvas"
        className="w-full h-full block object-contain"
      />

      {/* Autonomous AI status tag overlay */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-emerald-400 uppercase">{aiDebug.mode.replace('_', ' ')}</span>
          {aiDebug.targetApple && (
            <span className="text-zinc-500 text-[10px]">
              &bull; Alvo: +{aiDebug.targetApple.value} (Score: {aiDebug.targetScore})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
