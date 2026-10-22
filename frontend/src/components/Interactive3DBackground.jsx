import React, { useEffect, useRef } from 'react';

export default function Interactive3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse / Pointer interaction state with smooth inertia
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      lastMove: Date.now()
    };

    // 3D Scene Parameters (matched to illuminate-wheat theme)
    const FOCAL_LENGTH = 500;
    const PARTICLE_COUNT = 90;
    const SHAPE_COUNT = 7;
    
    // Camera Angles with smooth spring-damper interpolation
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    // 3D Particles in a cosmic sphere
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 240 + Math.random() * 420;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particles.push({
        origX: radius * Math.sin(phi) * Math.cos(theta),
        origY: radius * Math.sin(phi) * Math.sin(theta),
        origZ: radius * Math.cos(phi),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2.2 + 1.2,
        hue: Math.random() > 0.35 ? 275 + Math.random() * 30 : 45 + Math.random() * 15, // Violet/Fuchsia or Golden Starlight
        alpha: Math.random() * 0.65 + 0.35
      });
    }

    // 3D Wireframe Polyhedrons
    const shapes = [];
    for (let i = 0; i < SHAPE_COUNT; i++) {
      shapes.push({
        cx: (Math.random() - 0.5) * 700,
        cy: (Math.random() - 0.5) * 700,
        cz: (Math.random() - 0.5) * 450,
        size: 26 + Math.random() * 24,
        rotSpeedX: (Math.random() - 0.5) * 0.018,
        rotSpeedY: (Math.random() - 0.5) * 0.018,
        rotSpeedZ: (Math.random() - 0.5) * 0.018,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        hue: i % 2 === 0 ? 280 : 45,
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || width / 2;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || height / 2;

      mouse.targetX = clientX;
      mouse.targetY = clientY;
      mouse.lastMove = Date.now();

      targetRotY = ((clientX - width / 2) / width) * 1.3;
      targetRotX = -((clientY - height / 2) / height) * 0.95;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let t = 0;

    const render = () => {
      t += 0.0075;

      // Smooth camera interpolation
      rotX += (targetRotX - rotX) * 0.045;
      rotY += (targetRotY - rotY) * 0.045;

      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;

      if (Date.now() - mouse.lastMove > 2200) {
        targetRotY = Math.sin(t * 0.5) * 0.32;
        targetRotX = Math.cos(t * 0.4) * 0.18;
      }

      ctx.clearRect(0, 0, width, height);

      // Precalculate rotation matrices
      const cosY = Math.cos(rotY + t * 0.12);
      const sinY = Math.sin(rotY + t * 0.12);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = [];

      // 1. Project & draw 3D particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.origX += p.vx;
        p.origY += p.vy;
        p.origZ += p.vz;

        if (Math.abs(p.origX) > 440) p.vx *= -1;
        if (Math.abs(p.origY) > 440) p.vy *= -1;
        if (Math.abs(p.origZ) > 440) p.vz *= -1;

        // 3D Rotation
        const x1 = p.origX * cosY - p.origZ * sinY;
        const z1 = p.origZ * cosY + p.origX * sinY;

        const y2 = p.origY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.origY * sinX;

        // Magnetic distortion
        const screenX = width / 2 + (x1 * FOCAL_LENGTH) / (FOCAL_LENGTH + z2);
        const screenY = height / 2 + (y2 * FOCAL_LENGTH) / (FOCAL_LENGTH + z2);

        const dx = screenX - mouse.x;
        const dy = screenY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let pushZ = 0;
        if (dist < 150) {
          pushZ = (1 - dist / 150) * 50;
        }

        const finalZ = z2 + pushZ;
        if (finalZ + FOCAL_LENGTH <= 15) continue;

        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + finalZ);
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        projected.push({
          x: projX,
          y: projY,
          z: finalZ,
          scale,
          hue: p.hue,
          size: p.size * scale,
          alpha: Math.min(1, Math.max(0.12, (scale - 0.25) * p.alpha))
        });
      }

      projected.sort((a, b) => b.z - a.z);

      // Draw constellation lines
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < Math.min(i + 7, projected.length); j++) {
          const p2 = projected[j];
          const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
          if (distSq < 12000) {
            const lineAlpha = (1 - distSq / 12000) * 0.2 * p1.alpha * p2.alpha;
            ctx.strokeStyle = `hsla(${p1.hue}, 85%, 65%, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Star Nodes with glow
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.fillStyle = `hsla(${p.hue}, 95%, 72%, ${p.alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, 0.7)`;
        ctx.shadowBlur = 12 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.9, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 2. Render 3D Floating Diamonds / Prisms
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        s.rx += s.rotSpeedX;
        s.ry += s.rotSpeedY;
        s.rz += s.rotSpeedZ;

        const cx1 = s.cx * cosY - s.cz * sinY;
        const cz1 = s.cz * cosY + s.cx * sinY;
        const cy2 = s.cy * cosX - cz1 * sinX;
        const cz2 = cz1 * cosX + s.cy * sinX;

        if (cz2 + FOCAL_LENGTH <= 20) continue;
        const sScale = FOCAL_LENGTH / (FOCAL_LENGTH + cz2);
        const sProjX = width / 2 + cx1 * sScale;
        const sProjY = height / 2 + cy2 * sScale;

        const sz = s.size * sScale;
        ctx.save();
        ctx.translate(sProjX, sProjY);
        ctx.rotate(s.rz + t * 0.25);
        ctx.strokeStyle = `hsla(${s.hue}, 85%, 60%, ${Math.min(0.45, 0.65 * sScale)})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz, 0);
        ctx.lineTo(0, sz);
        ctx.lineTo(-sz, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-sz * 0.7, -sz * 0.3);
        ctx.lineTo(sz * 0.7, sz * 0.3);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Exact deep gradient background layers from illuminate-wheat.vercel.app */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
        style={{ background: 'radial-gradient(ellipse at 50% 35%, #0f0722 0%, #06030e 55%, #020106 100%)' }}
        aria-hidden="true"
      >
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(4, 2, 10, 0.62) 0%, rgba(3, 2, 7, 0.25) 50%, rgba(2, 1, 5, 0.85) 100%)' }} 
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen" 
          style={{ background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)' }} 
        />
      </div>

      {/* 3D Canvas Projection */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80"
        style={{ touchAction: 'none' }}
      />
    </>
  );
}
