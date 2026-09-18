"use client";

/**
 * AuroraBackground — v3
 * Full-bleed animated WebGL aurora, three-band shader with mouse tracking.
 * Fills its nearest positioned ancestor (position: relative + overflow: hidden).
 *
 * Usage:
 *   <div style={{ position: "relative", minHeight: "100vh" }}>
 *     <AuroraBackground />
 *     <div style={{ position: "relative", zIndex: 1 }}>
 *       ...content...
 *     </div>
 *   </div>
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AuroraBackgroundProps {
  /** First aurora color — cyan (default: SafePay #06B6D4) */
  colorA?: string;
  /** Second aurora color — purple (default: SafePay #8B5CF6) */
  colorB?: string;
  /** Third aurora color — rose accent (default: #F43F5E) */
  colorC?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Canvas opacity (0–1, default 0.85) */
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AuroraBackground({
  colorA = "#06B6D4",
  colorB = "#8B5CF6",
  colorC = "#F43F5E",
  speed = 1,
  opacity = 0.85,
  className = "",
  style = {},
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime:  { value: 0 },
      uRes:   { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uA:     { value: new THREE.Color(colorA) },
      uB:     { value: new THREE.Color(colorB) },
      uC:     { value: new THREE.Color(colorC) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2  uRes;
        uniform vec2  uMouse;
        uniform vec3  uA;
        uniform vec3  uB;
        uniform vec3  uC;

        float wave(vec2 p, float t, float freq, float spd, float amp, float ph){
          return sin(p.x * freq + t * spd + ph) * amp;
        }

        void main(){
          vec2 uv = vUv;
          float aspect = uRes.x / uRes.y;
          vec2 p = uv;
          p.x *= aspect;
          vec2 m = (uMouse - 0.5) * 0.08;
          p += m;

          float t = uTime * 0.12;

          float y1 = 0.3 + wave(p,t,1.8,0.8,0.12,0.0) + wave(p,t,3.5,0.5,0.04,1.2) + m.y*0.4;
          float y2 = 0.5 + wave(p,t,1.5,1.0,0.14,2.0) + wave(p,t,4.5,0.4,0.04,0.3) + m.x*0.3;
          float y3 = 0.7 + wave(p,t,1.2,0.7,0.10,3.1) - m.y*0.3;

          float b1 = smoothstep(0.32, 0.0, abs(p.y - y1));
          float b2 = smoothstep(0.34, 0.0, abs(p.y - y2));
          float b3 = smoothstep(0.28, 0.0, abs(p.y - y3));

          vec3 col = uA * b1 * 1.2 + uB * b2 * 1.1 + uC * b3 * 0.8;
          float glow = b1 * 0.6 + b2 * 0.55 + b3 * 0.4;

          gl_FragColor = vec4(col, min(glow, 0.85));
        }
      `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    function resize() {
      const parent = canvas!.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    window.addEventListener("resize", resize);

    /* Smooth mouse tracking */
    const targetMouse = { x: 0.5, y: 0.5 };
    const currentMouse = { x: 0.5, y: 0.5 };

    function onMouseMove(e: MouseEvent) {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1 - e.clientY / window.innerHeight;
    }
    window.addEventListener("mousemove", onMouseMove);

    let raf: number;
    const clock = new THREE.Clock();
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime() * speed;
      if (!reduceMotion) {
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;
        uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
        uniforms.uTime.value = t;
      } else {
        uniforms.uTime.value = t * 0.1;
      }
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, [colorA, colorB, colorC, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        opacity,
        zIndex: 0,
        ...style,
      }}
    />
  );
}
