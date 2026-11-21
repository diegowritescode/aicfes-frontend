import { useEffect, useRef } from 'react';

/**
 * The floating orb above the headline.
 *
 * A sphere whose surface is displaced by noise, lit from behind so it
 * reads as frosted glass rather than plastic. It breathes, turns
 * slowly, and tilts toward the cursor.
 *
 * Generated geometry rather than a downloaded model: a .glb of this
 * would be megabytes, and a learner on mobile data would watch a
 * blank hero while it loaded.
 */

const VERTEX = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPos;

  // Classic simplex-style noise, trimmed to what the surface needs.
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    // Two frequencies: a slow swell and a finer ripple over it.
    float n = snoise(position * 0.9 + uTime * 0.18) * 0.14
            + snoise(position * 2.1 - uTime * 0.12) * 0.05;
    vec3 pos = position + normal * n;
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vPos;

  void main() {
    vec3 n = normalize(vNormal);
    // Fresnel: edges brighten, which is what makes glass read as glass.
    float fres = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.2);
    // Two blues over a near-white core.
    vec3 hondo  = vec3(0.24, 0.56, 0.98);
    vec3 medio  = vec3(0.56, 0.82, 1.00);
    vec3 claro  = vec3(0.93, 0.98, 1.00);
    // Light pools at the top, as in frosted glass lit from above.
    float h = smoothstep(-1.2, 0.9, vPos.y);
    vec3 c = mix(hondo, medio, h);
    c = mix(c, claro, smoothstep(0.1, 1.0, h) * 0.7);
    c = mix(c, claro, fres * 0.55);
    // A soft highlight, up and to the left as the light is.
    float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.7, 0.8))), 0.0), 14.0);
    c += spec * 0.5;
    gl_FragColor = vec4(c, 0.82);
  }
`;

export function HeroScene({ className = '' }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = host.current;
    if (!nodo) return;

    let limpiar: (() => void) | undefined;
    let cancelado = false;

    // Imported here so Three.js lands in its own chunk: it is most of
    // the bundle, and the hero reads without the orb.
    void (async () => {
      const THREE = await import('three');
      if (cancelado) return;
      limpiar = montar(THREE, nodo);
    })();

    return () => {
      cancelado = true;
      limpiar?.();
    };
  }, []);

  return <div ref={host} aria-hidden className={className} />;
}

/** Builds the scene. Returns the teardown. */
function montar(THREE: typeof import('three'), nodo: HTMLDivElement): () => void {
  {

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camara.position.z = 4.2;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // No WebGL: the hero still reads, it just has no orb.
      return () => undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    nodo.appendChild(renderer.domElement);

    // Fewer segments on a phone: the orb is smaller there, and the
    // displacement does not need the detail.
    const segmentos = window.innerWidth < 768 ? 72 : 128;
    const geometria = new THREE.SphereGeometry(1.25, segmentos, segmentos);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      uniforms: { uTime: { value: 0 } },
    });
    const orbe = new THREE.Mesh(geometria, material);
    escena.add(orbe);

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

    // The orb leans toward the pointer, wherever it is on the page.
    const objetivo = { x: 0, y: 0 };
    const actual = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      objetivo.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      objetivo.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let visible = true;
    const reloj = new THREE.Clock();

    const bucle = () => {
      raf = requestAnimationFrame(bucle);
      if (!visible) return;
      const t = quieto ? 0 : reloj.getElapsedTime();
      material.uniforms.uTime!.value = t;
      actual.x += (objetivo.x - actual.x) * 0.05;
      actual.y += (objetivo.y - actual.y) * 0.05;
      orbe.rotation.y = t * 0.12 + actual.x;
      orbe.rotation.x = actual.y;
      // A slow bob, so it floats rather than hangs.
      orbe.position.y = Math.sin(t * 0.6) * 0.07;
      renderer.render(escena, camara);
    };
    bucle();

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
      window.removeEventListener('pointermove', onMove);
      geometria.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }
}

export default HeroScene;
