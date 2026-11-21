import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * The hero's 3D field: particles that drift, and part away from the
 * cursor.
 *
 * Built with raw Three.js rather than a wrapper, because the whole
 * scene is one points mesh — a renderer, a geometry and a shader. A
 * wrapper would add more weight than it saves.
 *
 * Everything is sized from the viewport and torn down on unmount, and
 * the loop stops when the tab is hidden or the scene scrolls out of
 * view: a hero that keeps a GPU busy behind a different tab drains a
 * phone for nothing.
 */

const VERTEX = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uSize;
  attribute float aScale;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // A slow drift, so the field is never completely still.
    pos.y += sin(uTime * 0.35 + position.x * 0.6) * 0.22;
    pos.x += cos(uTime * 0.28 + position.y * 0.5) * 0.18;

    // Push away from the cursor, falling off with distance: the
    // field parts around the pointer instead of snapping to it.
    vec2 toMouse = pos.xy - uMouse;
    float d = length(toMouse);
    float push = smoothstep(2.4, 0.0, d) * 0.9;
    pos.xy += normalize(toMouse + 0.0001) * push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // Perspective: nearer points are larger.
    // Clamped: without a ceiling, a near point fills a quarter of the
    // screen and the field reads as coloured fog over the headline.
    gl_PointSize = clamp(uSize * aScale * (1.0 / -mv.z), 1.0, 7.0);
  }
`;

const FRAGMENT = `
  varying vec3 vColor;

  void main() {
    // Round, soft-edged points. Square particles read as artefacts.
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(vColor, alpha * 0.55);
  }
`;

const PALETA = [
  new THREE.Color('#6D4AFF'),
  new THREE.Color('#FF3D8B'),
  new THREE.Color('#00D4FF'),
  new THREE.Color('#B8FF3D'),
];

export function HeroScene({ className = '' }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = host.current;
    if (!nodo) return;

    // Respect the setting before building anything at all.
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camara.position.z = 7;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      // No WebGL: the page still works, it just has no field.
      return;
    }
    // Capped: a phone at devicePixelRatio 3 renders nine times the
    // pixels for no visible gain.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    nodo.appendChild(renderer.domElement);

    // Fewer points on a phone, where the GPU is smaller and the
    // canvas is too narrow to show them apart.
    const total = window.innerWidth < 768 ? 1400 : 3600;
    const posiciones = new Float32Array(total * 3);
    const escalas = new Float32Array(total);
    const colores = new Float32Array(total * 3);

    for (let i = 0; i < total; i += 1) {
      posiciones[i * 3] = (Math.random() - 0.5) * 14;
      posiciones[i * 3 + 1] = (Math.random() - 0.5) * 9;
      posiciones[i * 3 + 2] = (Math.random() - 0.5) * 6;
      escalas[i] = 0.6 + Math.random() * 1.1;
      const c = PALETA[Math.floor(Math.random() * PALETA.length)] as THREE.Color;
      colores[i * 3] = c.r;
      colores[i * 3 + 1] = c.g;
      colores[i * 3 + 2] = c.b;
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    geometria.setAttribute('aScale', new THREE.BufferAttribute(escalas, 1));
    geometria.setAttribute('aColor', new THREE.BufferAttribute(colores, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uSize: { value: 90 },
      },
    });

    const puntos = new THREE.Points(geometria, material);
    escena.add(puntos);

    const medir = () => {
      const { clientWidth: w, clientHeight: h } = nodo;
      if (w === 0 || h === 0) return;
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(nodo);

    // The cursor is followed with easing, so the field never jumps.
    const objetivo = new THREE.Vector2(99, 99);
    const onMove = (e: PointerEvent) => {
      const r = nodo.getBoundingClientRect();
      objetivo.set(
        ((e.clientX - r.left) / r.width - 0.5) * 12,
        -((e.clientY - r.top) / r.height - 0.5) * 8,
      );
    };
    // Far away, so the field closes again when the pointer leaves.
    const onLeave = () => objetivo.set(99, 99);
    nodo.addEventListener('pointermove', onMove);
    nodo.addEventListener('pointerleave', onLeave);

    let raf = 0;
    let visible = true;
    const reloj = new THREE.Clock();

    const bucle = () => {
      raf = requestAnimationFrame(bucle);
      if (!visible) return;
      material.uniforms.uTime!.value = quieto ? 0 : reloj.getElapsedTime();
      const m = material.uniforms.uMouse!.value as THREE.Vector2;
      m.lerp(objetivo, 0.08);
      renderer.render(escena, camara);
    };
    bucle();

    // Stop when off-screen or on a hidden tab.
    const enPantalla = new IntersectionObserver(
      ([e]) => {
        visible = e?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    enPantalla.observe(nodo);
    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      enPantalla.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      nodo.removeEventListener('pointermove', onMove);
      nodo.removeEventListener('pointerleave', onLeave);
      geometria.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} aria-hidden className={`absolute inset-0 ${className}`} />;
}

export default HeroScene;
