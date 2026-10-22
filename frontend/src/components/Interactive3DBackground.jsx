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

    // Mouse / Pointer interaction state with inertia
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isMoving: false,
      lastMove: Date.now()
    };

    // 3D Scene Parameters
    const FOCAL_LENGTH = 450;
    const PARTICLE_COUNT = 85;
    const SHAPE_COUNT = 6;
    
    // Camera Angles with smooth interpolation
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    // Generate 3D Particles in a sphere / constellation cloud
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 220 + Math.random() * 380;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particles.push({
        origX: radius * Math.sin(phi) * Math.cos(theta),
        origY: radius * Math.sin(phi) * Math.sin(theta),
        origZ: radius * Math.cos(phi),
        x: 0,
        y: 0,
        z: 0,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.2 + 1.2,
        hue: Math.random() > 0.4 ? 275 + Math.random() * 30 : 45 + Math.random() * 20, // Purple/Fuchsia or Warm Gold
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    // Floating 3D Geometric Prisms (Tetrahedrons / Cubes)
    const shapes = [];
    for (let i = 0; i < SHAPE_COUNT; i++) {
      shapes.push({
        cx: (Math.random() - 0.5) * 600,
        cy: (Math.random() - 0.5) * 600,
        cz: (Math.random() - 0.5) * 400,
        size: 28 + Math.random() * 22,
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02,
        rotSpeedZ: (Math.random() - 0.5) * 0.02,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        hue: i % 2 === 0 ? 280 : 42,
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
      mouse.isMoving = true;
      mouse.lastMove = Date.now();

      // Convert pointer to camera rotational offset
      targetRotY = ((clientX - width / 2) / width) * 1.2;
      targetRotX = -((clientY - height / 2) / height) * 0.9;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let t = 0;

    // Render loop
    const render = () => {
      t += 0.008;

      // Smooth camera interpolation
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      // Mouse position smoothing
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Idle subtle breathing oscillation if no mouse movement
      if (Date.now() - mouse.lastMove > 2000) {
        targetRotY = Math.sin(t * 0.5) * 0.35;
        targetRotX = Math.cos(t * 0.4) * 0.2;
      }

      // Clear with dark subtle fade
      ctx.clearRect(0, 0, width, height);

      // Precalculate trig for rotation
      const cosY = Math.cos(rotY + t * 0.15);
      const sinY = Math.sin(rotY + t * 0.15);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = [];

      // 1. Project & draw 3D particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Animate particles slowly
        p.origX += p.vx;
        p.origY += p.vy;
        p.origZ += p.vz;

        // Bounce within sphere bounds
        if (Math.abs(p.origX) > 420) p.vx *= -1;
        if (Math.abs(p.origY) > 420) p.vy *= -1;
        if (Math.abs(p.origZ) > 420) p.vz *= -1;

        // 3D Rotation (Yaw around Y, then Pitch around X)
        const x1 = p.origX * cosY - p.origZ * sinY;
        const z1 = p.origZ * cosY + p.origX * sinY;

        const y2 = p.origY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.origY * sinX;

        // Interactive mouse magnetic distortion in 3D
        const screenX = width / 2 + (x1 * FOCAL_LENGTH) / (FOCAL_LENGTH + z2);
        const screenY = height / 2 + (y2 * FOCAL_LENGTH) / (FOCAL_LENGTH + z2);

        const dx = screenX - mouse.x;
        const dy = screenY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let pushZ = 0;
        if (dist < 140) {
          const force = (1 - dist / 140) * 45;
          pushZ = force;
        }

        const finalZ = z2 + pushZ;
        if (finalZ + FOCAL_LENGTH <= 10) continue; // Behind camera

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
          alpha: Math.min(1, Math.max(0.1, (scale - 0.3) * p.alpha))
        });
      }

      // Sort by depth (painters algorithm)
      projected.sort((a, b) => b.z - a.z);

      // Draw constellation connective lines between nearby nodes
      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < Math.min(i + 8, projected.length); j++) {
          const p2 = projected[j];
          const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
          if (distSq < 11000) {
            const lineAlpha = (1 - distSq / 11000) * 0.22 * p1.alpha * p2.alpha;
            ctx.strokeStyle = `hsla(${p1.hue}, 85%, 65%, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Glowing Particles
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, 0.6)`;
        ctx.shadowBlur = 10 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, p.size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 2. Render Floating 3D Geometric Wireframe Shapes
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        s.rx += s.rotSpeedX;
        s.ry += s.rotSpeedY;
        s.rz += s.rotSpeedZ;

        // Apply World Rotation
        const cx1 = s.cx * cosY - s.cz * sinY;
        const cz1 = s.cz * cosY + s.cx * sinY;
        const cy2 = s.cy * cosX - cz1 * sinX;
        const cz2 = cz1 * cosX + s.cy * sinX;

        if (cz2 + FOCAL_LENGTH <= 20) continue;
        const sScale = FOCAL_LENGTH / (FOCAL_LENGTH + cz2);
        const sProjX = width / 2 + cx1 * sScale;
        const sProjY = height / 2 + cy2 * sScale;

        // Draw small rotating 3D octahedron / diamond
        const sz = s.size * sScale;
        ctx.save();
        ctx.translate(sProjX, sProjY);
        ctx.rotate(s.rz + t * 0.3);
        ctx.strokeStyle = `hsla(${s.hue}, 85%, 60%, ${Math.min(0.4, 0.6 * sScale)})`;
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80"
      style={{ touchAction: 'none' }}
    />
  );
}
