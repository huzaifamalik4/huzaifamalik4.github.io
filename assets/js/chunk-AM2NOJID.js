import"./chunk-O2XFH626.js";var ie="assets/img/hero-portrait.webp";var _=["<!-- huzaifamalik.me -->",'<section class="hero">',"  <h1>Web developer building</h1>","  <h1>websites that feel alive.</h1>","</section>","","const huzaifa = {","  role: 'developer + designer',","  based: 'Pakistan',","  since: 2020,","  stack: ['WordPress', 'Shopify', 'React'],","  available: true,","};","","function build(idea) {","  const design = sketch(idea);","  const site = code(design);","  return launch(site);","}","",".site {","  speed: fast;","  layout: responsive;","  details: considered;","}","","add_action('init', 'register_theme');","<?php get_template_part('hero'); ?>","","@media (max-width: 700px) {","  .grid { grid-template-columns: 1fr; }","}","","while (!client.isHappy) refine(site);",'git commit -m "ship it"',""],ae=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,ne=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uAspect;
uniform float uRadius;
uniform float uPaint;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.000001), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  float c = texture2D(uPrev, vUv).r;
  float n = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r
          + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
          + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r
          + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float v = mix(c, n * 0.25, 0.4);
  v = v * 0.98 - 0.0024;
  vec2 s = vec2(uAspect, 1.0);
  float d = segmentDistance(vUv * s, uFrom * s, uTo * s);
  v += uPaint * smoothstep(uRadius, uRadius * 0.2, d);
  gl_FragColor = vec4(clamp(v, 0.0, 1.0), 0.0, 0.0, 1.0);
}`,se=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto;
uniform sampler2D uCode;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform vec2 uTrailTexel;
uniform float uTime;
uniform float uImageAspect;
uniform float uFocalX;
uniform float uAnchor;
uniform float uCodeTile;
uniform float uReveal;
uniform float uPhotoReady;

const vec3 BLUE = vec3(0.133, 0.220, 1.0);
const vec3 DEEP = vec3(0.020, 0.035, 0.300);
const vec3 SKY = vec3(0.520, 0.580, 1.0);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// Fit the wide photo to the stage like "cover", keeping the face in frame.
vec2 photoUv(vec2 uv) {
  float stage = uRes.x / uRes.y;
  if (stage < uImageAspect) {
    float w = stage / uImageAspect;
    float left = clamp(uFocalX - w * uAnchor, 0.0, 1.0 - w);
    return vec2(left + uv.x * w, uv.y);
  }
  float h = uImageAspect / stage;
  return vec2(uv.x, (1.0 - h) * 0.56 + uv.y * h);
}

void main() {
  vec2 uv = vUv;
  float stage = uRes.x / uRes.y;

  float t = texture2D(uTrail, uv).r;
  vec2 grad = vec2(
    texture2D(uTrail, uv + vec2(uTrailTexel.x * 2.0, 0.0)).r - texture2D(uTrail, uv - vec2(uTrailTexel.x * 2.0, 0.0)).r,
    texture2D(uTrail, uv + vec2(0.0, uTrailTexel.y * 2.0)).r - texture2D(uTrail, uv - vec2(0.0, uTrailTexel.y * 2.0)).r
  );

  // A wobbling edge makes the wiped area read as liquid, not as a hard circle.
  float wobble = noise(vec2(uv.x * stage, uv.y) * 4.0 + uTime * 0.3) - 0.5;
  float field = t + wobble * 0.3 * smoothstep(0.03, 0.3, t);
  float mask = smoothstep(0.30, 0.35, field) * uPhotoReady;

  vec2 pUv = photoUv(uv);
  float lum = dot(texture2D(uPhoto, pUv).rgb, vec3(0.299, 0.587, 0.114));
  float tone = pow(smoothstep(0.04, 0.93, lum), 0.78);
  tone = mix(0.62, tone, uReveal * uPhotoReady);

  // Code side: the portrait as a two-colour print, with code laid over it.
  vec3 print = mix(DEEP, BLUE, smoothstep(0.0, 0.7, tone));
  print = mix(print, SKY, smoothstep(0.78, 1.0, tone) * 0.22);
  vec2 cUv = vec2(uv.x * stage, uv.y) / uCodeTile;
  cUv.y -= uTime * 0.006;
  vec3 texel = texture2D(uCode, cUv).rgb;
  float ink = max(texel.r, max(texel.g, texel.b));
  vec3 tint = texel / max(ink, 0.001);
  vec3 codeSide = mix(print, tint, ink * mix(0.07, 0.92, tone));

  // Photo side, bent slightly near the edge of the wiped area.
  vec3 photo = texture2D(uPhoto, photoUv(uv - grad * 0.05)).rgb;

  vec3 color = mix(codeSide, photo, mask);
  float rim = smoothstep(0.24, 0.30, field) * (1.0 - smoothstep(0.35, 0.43, field)) * uPhotoReady;
  color = mix(color, vec3(1.0), rim * 0.5);

  color += (hash(uv * uRes + fract(uTime) * 100.0) - 0.5) * 0.03;
  gl_FragColor = vec4(color, 1.0);
}`;function J(t,f,o){let e=t.createShader(f);if(t.shaderSource(e,o),t.compileShader(e),!t.getShaderParameter(e,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(e)||"shader failed to compile");return e}function Q(t,f){let o=t.createProgram();if(t.attachShader(o,J(t,t.VERTEX_SHADER,ae)),t.attachShader(o,J(t,t.FRAGMENT_SHADER,f)),t.bindAttribLocation(o,0,"aPos"),t.linkProgram(o),!t.getProgramParameter(o,t.LINK_STATUS))throw new Error(t.getProgramInfoLog(o)||"program failed to link");let e={},v=t.getProgramParameter(o,t.ACTIVE_UNIFORMS);for(let l=0;l<v;l++){let{name:s}=t.getActiveUniform(o,l);e[s]=t.getUniformLocation(o,s)}return{program:o,uniforms:e}}function ue(){let f=document.createElement("canvas");f.width=1024,f.height=1024;let o=f.getContext("2d");o.fillStyle="#000",o.fillRect(0,0,1024,1024),o.font='600 19px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace',o.textBaseline="top";let e=1024/_.length,v=/(<!--.*?-->|'[^']*'|"[^"]*"|\b(?:const|function|return|while|true|class|section|h1|php)\b|\d+|[{}()[\];,<>=/:!?.@-]+)/g,l=s=>s.startsWith("<!--")?"#8f9bff":/^['"]/.test(s)?"#c8d0ff":/^(?:const|function|return|while|true|class|section|h1|php)$/.test(s)?"#aab6ff":/^\d+$/.test(s)?"#c8d0ff":/^[{}()[\];,<>=/:!?.@-]+$/.test(s)?"#9aa6ff":"#ffffff";for(let s=0;s<2;s++){let A=s===0?0:Math.floor(_.length/2);_.forEach((H,P)=>{let x=_[(P+A)%_.length],d=20+s*(1024/2),E=P*e+5;x.split(v).forEach(u=>{u&&(o.fillStyle=l(u),o.fillText(u,d,E),d+=o.measureText(u).width)})})}return f}function ce(t,{reducedMotion:f=!1}={}){let o=document.createElement("canvas"),e=o.getContext("webgl",{antialias:!1,alpha:!1,powerPreference:"high-performance"});if(!e)return null;let v,l;try{v=Q(e,ne),l=Q(e,se)}catch(i){return console.error(i),null}t.appendChild(o);let s=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,s),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0);function A({repeat:i=!1,mipmap:n=!1}={}){let a=e.createTexture();e.bindTexture(e.TEXTURE_2D,a);let c=i?e.REPEAT:e.CLAMP_TO_EDGE;return e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,n?e.LINEAR_MIPMAP_LINEAR:e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),a}let H=A({repeat:!0,mipmap:!0});e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,ue()),e.generateMipmap(e.TEXTURE_2D);let P=A();e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([150,150,150,255]));let x=!1,d=0,E=new Image;E.decoding="async",E.onload=()=>{e.bindTexture(e.TEXTURE_2D,P),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,E),x=!0},E.src=ie;let u=[0,1].map(()=>({texture:A(),framebuffer:e.createFramebuffer(),width:0,height:0}));function Z(i){let a=Math.max(48,Math.min(512,Math.round(192/i)));u.forEach(c=>{c.width=192,c.height=a,e.bindTexture(e.TEXTURE_2D,c.texture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,192,a,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindFramebuffer(e.FRAMEBUFFER,c.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,c.texture,0),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)}),e.bindFramebuffer(e.FRAMEBUFFER,null)}let ee=window.matchMedia("(pointer: coarse)").matches,z=Math.min(window.devicePixelRatio||1,ee?2:1.75),L=z,S=1,U=1,h=1;function C(){S=t.clientWidth||1,U=t.clientHeight||1;let i=S/U;o.width=Math.round(S*L),o.height=Math.round(U*L),(Math.abs(i-h)>.01||!u[0].width)&&(h=i,Z(h))}let W=new ResizeObserver(C);W.observe(t),C();let r={x:.5,y:.5,px:.5,py:.5,tx:.5,ty:.5,lastMove:-1e9,inside:!1,paint:0},Y=i=>.5+.14*Math.min(1,Math.max(0,(i-.9)/.9));function q(i){let n=t.getBoundingClientRect();r.tx=(i.clientX-n.left)/n.width,r.ty=1-(i.clientY-n.top)/n.height,r.lastMove=performance.now(),r.inside||(r.inside=!0,r.x=r.px=r.tx,r.y=r.py=r.ty)}function V(){r.inside=!1,r.lastMove=-1e9}t.addEventListener("pointermove",q,{passive:!0}),t.addEventListener("pointerdown",q,{passive:!0}),t.addEventListener("pointerleave",V,{passive:!0}),t.addEventListener("pointercancel",V,{passive:!0});let T=0;function te(i,n,a,c,R){let g=u[T],b=u[1-T],m=v.uniforms;e.useProgram(v.program),e.bindFramebuffer(e.FRAMEBUFFER,b.framebuffer),e.viewport(0,0,b.width,b.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,g.texture),e.uniform1i(m.uPrev,0),e.uniform2f(m.uTexel,1/g.width,1/g.height),e.uniform2f(m.uFrom,i,n),e.uniform2f(m.uTo,a,c),e.uniform1f(m.uAspect,h),e.uniform1f(m.uRadius,h<1?.13:.17),e.uniform1f(m.uPaint,R),e.drawArrays(e.TRIANGLE_STRIP,0,4),T=1-T}function re(i,n){let a=l.uniforms;e.useProgram(l.program),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,o.width,o.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,P),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,H),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,u[T].texture),e.uniform1i(a.uPhoto,0),e.uniform1i(a.uCode,1),e.uniform1i(a.uTrail,2),e.uniform2f(a.uRes,o.width,o.height),e.uniform2f(a.uTrailTexel,1/u[T].width,1/u[T].height),e.uniform1f(a.uTime,i),e.uniform1f(a.uImageAspect,2.4),e.uniform1f(a.uFocalX,.652),e.uniform1f(a.uAnchor,Y(h)),e.uniform1f(a.uCodeTile,590/U),e.uniform1f(a.uReveal,n),e.uniform1f(a.uPhotoReady,x?1:0),e.drawArrays(e.TRIANGLE_STRIP,0,4)}let X=0,B=45,w=0,N=0;function oe(i){if(X>=2||i>200)return;if(B>0){B-=1;return}if(N+=i,w+=1,w<60)return;let n=N/w;N=0,w=0,n>25&&(X+=1,L=X===1?Math.min(z,1.15):.8,B=20,C())}let y=1/60,O=!1,G=!1,D=!0,k=0,F=0,p=0,I=0;function K(i){k=requestAnimationFrame(K),oe(i-F);let n=Math.min((i-F)/1e3||y,.1);F=i,p+=n,x&&!d&&(d=p);let a=d?p-d:0,c=f?1:Math.min(1,a/1.6),R=i-r.lastMove>2400;if(R){let m=Y(h);r.tx=m+(Math.cos(p*.62)*.2+Math.cos(p*.21)*.07)/Math.max(h,.8),r.ty=.55+Math.sin(p*.83)*.2}let g=1-Math.exp(-(R?3:16)*n);r.x+=(r.tx-r.x)*g,r.y+=(r.ty-r.y)*g;let b=x&&a>.9&&!(R&&f)?R?.16:.5:0;for(r.paint+=(b-r.paint)*(1-Math.exp(-6*n)),I=Math.min(I+n,y*4);I>=y;)te(r.px,r.py,r.x,r.y,r.paint),r.px=r.x,r.py=r.y,I-=y;re(p,c)}function M(i){i!==O&&(O=i,cancelAnimationFrame(k),O&&(F=performance.now(),k=requestAnimationFrame(K)))}let $=new IntersectionObserver(([i])=>{D=i.isIntersecting,G&&M(D&&!document.hidden)},{rootMargin:"80px"});$.observe(t);function j(){G&&M(D&&!document.hidden)}return document.addEventListener("visibilitychange",j),{start(){G=!0,t.classList.add("is-live"),M(D&&!document.hidden)},dispose(){M(!1),$.disconnect(),W.disconnect(),document.removeEventListener("visibilitychange",j),o.remove()}}}export{ce as createHero};
