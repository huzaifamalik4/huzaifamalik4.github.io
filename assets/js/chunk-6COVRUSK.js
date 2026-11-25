import{a as A,b as Q}from"./chunk-7YRXEQNU.js";import"./chunk-O2XFH626.js";var ne="assets/img/hero-portrait.webp",ue=2040/850,ce=.652,Z=192,se={comment:"#8f9bff",string:"#c8d0ff",keyword:"#aab6ff",number:"#c8d0ff",punctuation:"#9aa6ff",plain:"#ffffff"},fe=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,le=`
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
}`,me=`
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
}`;function $(t,c,r){let e=t.createShader(c);if(t.shaderSource(e,r),t.compileShader(e),!t.getShaderParameter(e,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(e)||"shader failed to compile");return e}function ee(t,c){let r=t.createProgram();if(t.attachShader(r,$(t,t.VERTEX_SHADER,fe)),t.attachShader(r,$(t,t.FRAGMENT_SHADER,c)),t.bindAttribLocation(r,0,"aPos"),t.linkProgram(r),!t.getProgramParameter(r,t.LINK_STATUS))throw new Error(t.getProgramInfoLog(r)||"program failed to link");let e={},s=t.getProgramParameter(r,t.ACTIVE_UNIFORMS);for(let f=0;f<s;f++){let{name:U}=t.getActiveUniform(r,f);e[U]=t.getUniformLocation(r,U)}return{program:r,uniforms:e}}function ve(){let c=document.createElement("canvas");c.width=1024,c.height=1024;let r=c.getContext("2d");r.fillStyle="#000",r.fillRect(0,0,1024,1024),r.font='600 19px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace',r.textBaseline="top";let e=1024/A.length;for(let s=0;s<2;s++){let f=s===0?0:Math.floor(A.length/2);A.forEach((U,p)=>{let L=A[(p+f)%A.length],P=20+s*(1024/2),x=p*e+5;Q(L).forEach(({text:v,kind:E})=>{r.fillStyle=se[E],r.fillText(v,P,x),P+=r.measureText(v).width})})}return c}function Te(t,{reducedMotion:c=!1}={}){let r=document.createElement("canvas"),e=r.getContext("webgl",{antialias:!1,alpha:!1,powerPreference:"high-performance"});if(!e)return null;let s,f;try{s=ee(e,le),f=ee(e,me)}catch(i){return console.error(i),null}t.appendChild(r);let U=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,U),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0);function p({repeat:i=!1,mipmap:n=!1}={}){let a=e.createTexture();e.bindTexture(e.TEXTURE_2D,a);let u=i?e.REPEAT:e.CLAMP_TO_EDGE;return e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,n?e.LINEAR_MIPMAP_LINEAR:e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),a}let L=p({repeat:!0,mipmap:!0});e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,ve()),e.generateMipmap(e.TEXTURE_2D);let P=p();e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([150,150,150,255]));let x=!1,v=0,E=new Image;E.decoding="async",E.onload=()=>{e.bindTexture(e.TEXTURE_2D,P),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,E),x=!0},E.src=ne;let h=[0,1].map(()=>({texture:p(),framebuffer:e.createFramebuffer(),width:0,height:0}));function te(i){let n=Z,a=Math.max(48,Math.min(512,Math.round(Z/i)));h.forEach(u=>{u.width=n,u.height=a,e.bindTexture(e.TEXTURE_2D,u.texture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,n,a,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindFramebuffer(e.FRAMEBUFFER,u.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,u.texture,0),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)}),e.bindFramebuffer(e.FRAMEBUFFER,null)}let oe=window.matchMedia("(pointer: coarse)").matches,H=Math.min(window.devicePixelRatio||1,oe?2:1.75),S=H,C=1,_=1,m=1;function X(){C=t.clientWidth||1,_=t.clientHeight||1;let i=C/_;r.width=Math.round(C*S),r.height=Math.round(_*S),(Math.abs(i-m)>.01||!h[0].width)&&(m=i,te(m))}let Y=new ResizeObserver(X);Y.observe(t),X();let o={x:.5,y:.5,px:.5,py:.5,tx:.5,ty:.5,lastMove:-1e9,inside:!1,paint:0},W=i=>.5+.14*Math.min(1,Math.max(0,(i-.9)/.9));function q(i){let n=t.getBoundingClientRect();o.tx=(i.clientX-n.left)/n.width,o.ty=1-(i.clientY-n.top)/n.height,o.lastMove=performance.now(),o.inside||(o.inside=!0,o.x=o.px=o.tx,o.y=o.py=o.ty)}function K(){o.inside=!1,o.lastMove=-1e9}t.addEventListener("pointermove",q,{passive:!0}),t.addEventListener("pointerdown",q,{passive:!0}),t.addEventListener("pointerleave",K,{passive:!0}),t.addEventListener("pointercancel",K,{passive:!0});let T=0;function re(i,n,a,u,R){let g=h[T],b=h[1-T],l=s.uniforms;e.useProgram(s.program),e.bindFramebuffer(e.FRAMEBUFFER,b.framebuffer),e.viewport(0,0,b.width,b.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,g.texture),e.uniform1i(l.uPrev,0),e.uniform2f(l.uTexel,1/g.width,1/g.height),e.uniform2f(l.uFrom,i,n),e.uniform2f(l.uTo,a,u),e.uniform1f(l.uAspect,m),e.uniform1f(l.uRadius,m<1?.13:.17),e.uniform1f(l.uPaint,R),e.drawArrays(e.TRIANGLE_STRIP,0,4),T=1-T}function ie(i,n){let a=f.uniforms;e.useProgram(f.program),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,r.width,r.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,P),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,L),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,h[T].texture),e.uniform1i(a.uPhoto,0),e.uniform1i(a.uCode,1),e.uniform1i(a.uTrail,2),e.uniform2f(a.uRes,r.width,r.height),e.uniform2f(a.uTrailTexel,1/h[T].width,1/h[T].height),e.uniform1f(a.uTime,i),e.uniform1f(a.uImageAspect,ue),e.uniform1f(a.uFocalX,ce),e.uniform1f(a.uAnchor,W(m)),e.uniform1f(a.uCodeTile,590/_),e.uniform1f(a.uReveal,n),e.uniform1f(a.uPhotoReady,x?1:0),e.drawArrays(e.TRIANGLE_STRIP,0,4)}let B=0,N=45,w=0,G=0;function ae(i){if(B>=2||i>200)return;if(N>0){N-=1;return}if(G+=i,w+=1,w<60)return;let n=G/w;G=0,w=0,n>25&&(B+=1,S=B===1?Math.min(H,1.15):.8,N=20,X())}let y=1/60,O=!1,k=!1,D=!0,z=0,F=0,d=0,M=0;function V(i){z=requestAnimationFrame(V),ae(i-F);let n=Math.min((i-F)/1e3||y,.1);F=i,d+=n,x&&!v&&(v=d);let a=v?d-v:0,u=c?1:Math.min(1,a/1.6),R=i-o.lastMove>2400;if(R){let l=W(m);o.tx=l+(Math.cos(d*.62)*.2+Math.cos(d*.21)*.07)/Math.max(m,.8),o.ty=.55+Math.sin(d*.83)*.2}let g=1-Math.exp(-(R?3:16)*n);o.x+=(o.tx-o.x)*g,o.y+=(o.ty-o.y)*g;let b=x&&a>.9&&!(R&&c)?R?.16:.5:0;for(o.paint+=(b-o.paint)*(1-Math.exp(-6*n)),M=Math.min(M+n,y*4);M>=y;)re(o.px,o.py,o.x,o.y,o.paint),o.px=o.x,o.py=o.y,M-=y;ie(d,u)}function I(i){i!==O&&(O=i,cancelAnimationFrame(z),O&&(F=performance.now(),z=requestAnimationFrame(V)))}let j=new IntersectionObserver(([i])=>{D=i.isIntersecting,k&&I(D&&!document.hidden)},{rootMargin:"80px"});j.observe(t);function J(){k&&I(D&&!document.hidden)}return document.addEventListener("visibilitychange",J),{start(){k=!0,t.classList.add("is-live"),I(D&&!document.hidden)},dispose(){I(!1),j.disconnect(),Y.disconnect(),document.removeEventListener("visibilitychange",J),r.remove()}}}export{Te as createHero};
