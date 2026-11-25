import"./chunk-O2XFH626.js";var He=["<!-- huzaifamalik.me -->",'<section class="hero">',"  <h1>Web developer building</h1>","  <h1>websites that feel alive.</h1>","</section>","","const huzaifa = {","  role: 'developer + designer',","  based: 'Pakistan',","  since: 2020,","  stack: ['WordPress', 'Shopify', 'React'],","  available: true,","};","","function build(idea) {","  const design = sketch(idea);","  const site = code(design);","  return launch(site);","}","",".site {","  speed: fast;","  layout: responsive;","  details: considered;","}","","add_action('init', 'register_theme');","<?php get_template_part('hero'); ?>","","@media (max-width: 700px) {","  .grid { grid-template-columns: 1fr; }","}","","while (!client.isHappy) refine(site);",'git commit -m "ship it"',""],tt=/(<!--.*?-->|'[^']*'|"[^"]*"|\b(?:const|function|return|while|true|class|section|h1|php)\b|\d+|[{}()[\];,<>=/:!?.@-]+)/g;function ot(o){return o.startsWith("<!--")?"comment":/^['"]/.test(o)?"string":/^(?:const|function|return|while|true|class|section|h1|php)$/.test(o)?"keyword":/^\d+$/.test(o)?"number":/^[{}()[\];,<>=/:!?.@-]+$/.test(o)?"punctuation":"plain"}function ze(o){return o.split(tt).filter(Boolean).map(l=>({text:l,kind:ot(l)}))}var at="assets/img/hero-figure.webp",We=896/850,pe=[.49,.41],ee=16,$e=8,S=64,ge=94,Pe=.17,rt={comment:.22,string:.8,keyword:1,number:.85,punctuation:.42,plain:.6},nt=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,it=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uFigure;
uniform vec2 uRes;
uniform vec4 uBox;
uniform vec2 uFocus;
uniform vec3 uPointer;
uniform vec4 uWave;
uniform float uReveal;
uniform float uScan;
uniform float uBand;
uniform float uTime;
uniform float uReady;

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

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float unit = uRes.y;

  // Near-black indigo, a little lighter behind the figure.
  float fromFocus = length((p - uFocus) / unit);
  vec3 color = mix(vec3(0.046, 0.054, 0.190), vec3(0.016, 0.018, 0.062), smoothstep(0.0, 1.05, fromFocus));

  vec2 fuv = (p - uBox.xy) / uBox.zw;
  float inside = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
  vec4 figure = texture2D(uFigure, clamp(fuv, 0.0, 1.0)) * inside * uReady;
  float matte = smoothstep(0.5, 0.97, figure.a);
  float lum = figure.r;
  // A soft copy of the figure's outline: the glow of someone standing behind the code.
  float halo = texture2D(uFigure, clamp(fuv, 0.0, 1.0), 4.6).a * inside * uReady;

  float grain = noise(p / unit * 5.0 + uTime * 0.25);

  // The opening the pointer makes in the code.
  float away = length(p - uPointer.xy);
  float radius = max(uPointer.z, 0.001);
  float open = smoothstep(6.0, 34.0, uPointer.z);
  float opening = smoothstep(radius, radius * 0.72, away + (grain - 0.5) * radius * 0.25) * step(1.0, uPointer.z);

  // The photograph arriving, from the face outwards.
  float arrived = smoothstep(0.0, 0.22, uReveal * 1.9 - fromFocus + (grain - 0.5) * 0.14);

  vec3 xray = mix(vec3(0.03, 0.04, 0.22), vec3(0.40, 0.47, 1.0), smoothstep(0.02, 0.62, lum));
  xray = mix(xray, vec3(0.93, 0.95, 1.0), smoothstep(0.55, 0.95, lum));
  vec3 natural = vec3(pow(lum, 0.92)) * vec3(0.97, 0.98, 1.03);
  vec3 photo = mix(xray, natural, arrived);

  color += vec3(0.11, 0.14, 0.60) * halo * (0.42 + 0.4 * arrived);
  color = mix(color, photo, max(opening, arrived) * matte);

  // Light: around the pointer, along a ripple, and where the characters are flipping.
  float bloom = exp(-pow(away / (radius * 2.4), 2.0)) * open;
  float rim = exp(-pow((away - radius) / (radius * 0.3), 2.0)) * open;
  color += vec3(0.30, 0.36, 1.0) * bloom * 0.2 + vec3(0.62, 0.68, 1.0) * rim * 0.2;
  float ring = exp(-pow((length(p - uWave.xy) - uWave.z) / (unit * 0.045), 2.0)) * uWave.w;
  color += vec3(0.45, 0.52, 1.0) * ring * 0.3;
  float along = (p.y + p.x * 0.16) / (uRes.y + uRes.x * 0.16);
  float flipping = exp(-pow((along * 0.84 + 0.08 - (uScan - uBand * 0.5)) / (uBand * 0.42), 2.0));
  flipping *= smoothstep(0.0, 0.06, uScan) * (1.0 - smoothstep(1.0, 1.0 + uBand, uScan));
  color += vec3(0.20, 0.25, 0.9) * flipping * 0.15;

  vec2 c = vUv - 0.5;
  color *= 1.0 - dot(c, c) * 0.5;
  color += (hash(p + fract(uTime) * 100.0) - 0.5) * 0.022;
  gl_FragColor = vec4(color, 1.0);
}`,st=`
attribute vec2 aHome;
attribute vec3 aMove;
attribute vec4 aInfo;
attribute vec3 aTone;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform float uRatio;
uniform float uCell;
uniform float uScan;
uniform float uBand;
uniform float uReveal;
uniform float uIntro;
uniform float uTime;
uniform float uMaxPoint;
varying vec2 vCell;
varying vec4 vColor;
varying vec3 vShape;

const float PI = 3.14159265;
const float TURNS = 3.0;

void main() {
  float seed = aInfo.x;
  float weight = aInfo.w;
  float tone = aTone.x;
  float matte = aTone.y;
  float heat = aMove.z;

  // The flip travels down the stage on a slight slant, ragged at its edge, a word at a time.
  // Each character turns over three times: its code face, two passing faces, then its place
  // in the portrait.
  float along = (aHome.y + aHome.x * 0.16) / (uRes.y + uRes.x * 0.16);
  float f = clamp((uScan - along * 0.84 - aTone.z * 0.16) / uBand, 0.0, 1.0);
  float eased = f * f * (3.0 - 2.0 * f);
  float face = floor(eased * TURNS + 0.5);
  float glyph = aInfo.y;
  if (face > TURNS - 0.5) glyph = aInfo.z;
  else if (face > 0.5) glyph = 1.0 + floor(fract(seed * 91.7 + face * 0.37) * 93.99);
  vCell = vec2(mod(glyph, 16.0), floor(glyph / 16.0));
  float side = step(TURNS - 0.5, face);
  float mid = sin(f * PI);

  // Where the photograph has come through, the characters over the figure drift off.
  vec2 fromFace = aHome - uFocus;
  float reach = length(fromFace) / uRes.y;
  float gone = smoothstep(0.0, 0.22, uReveal * 1.9 - reach - seed * 0.18) * smoothstep(0.2, 0.6, matte);

  // As code: one blue, brighter for keywords, a touch brighter where someone stands behind it.
  float twinkle = 0.86 + 0.14 * sin(uTime * 1.7 + seed * 50.0);
  vec3 codeColor = mix(vec3(0.36, 0.42, 1.0), vec3(0.72, 0.77, 1.0), weight);
  float codeAlpha = mix(0.4, 0.92, weight) * twinkle * mix(0.74, 1.25, matte);

  // As portrait: the tone of the photograph decides the colour and the strength. Each
  // character also lights the square behind it, so the tones join up into a picture.
  vec3 ink = mix(vec3(0.20, 0.24, 0.74), vec3(0.50, 0.57, 1.0), smoothstep(0.0, 0.5, tone));
  ink = mix(ink, vec3(0.97, 0.98, 1.0), smoothstep(0.42, 0.95, tone));
  vec3 portraitColor = mix(codeColor, ink, matte);
  float portraitAlpha = mix(codeAlpha * 0.45, mix(0.42, 1.0, tone), matte);

  vec3 color = mix(codeColor, portraitColor, side);
  float alpha = mix(codeAlpha, portraitAlpha, side);
  float backing = side * matte * pow(tone, 1.5) * 0.9;

  // Characters that are turning, or being pushed, burn bright. Edge-on, a turning
  // character fades instead of collapsing into a line.
  float squash = abs(cos(eased * TURNS * PI));
  float hot = clamp(mid * 0.7 + heat, 0.0, 1.0);
  color = mix(color, mix(vec3(0.80, 0.84, 1.0), vec3(1.0), heat), clamp(mid * 0.6 + heat, 0.0, 1.0) * 0.85);
  alpha = mix(alpha, 1.0, hot * 0.9) * smoothstep(0.04, 0.45, squash);

  // On arrival the code writes itself down the stage.
  float written = smoothstep(0.0, 0.25, uIntro * 1.45 - along - seed * 0.2);
  alpha *= (1.0 - gone) * written;
  backing *= (1.0 - gone) * written;

  vColor = vec4(color, alpha);
  vShape = vec3(max(squash, 0.05), backing, hot);

  vec2 drift = normalize(fromFace + 0.001) * gone * gone * uCell * (1.5 + seed * 5.0);
  vec2 p = aHome + aMove.xy + drift;
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  float size = uCell * (1.0 + mid * 0.4 + heat * 0.55) * (1.0 - gone * 0.4);
  gl_PointSize = min(size * uRatio, uMaxPoint);
}`,lt=`
precision mediump float;
uniform sampler2D uAtlas;
varying vec2 vCell;
varying vec4 vColor;
varying vec3 vShape;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  q.y /= vShape.x;
  if (abs(q.y) > 0.5) discard;
  float ink = texture2D(uAtlas, (vCell + q + 0.5) / vec2(${ee}.0, ${$e}.0)).r;
  float box = step(abs(q.x), 0.26) * step(abs(q.y), 0.46) * vShape.y;
  float a = max(ink * vColor.a, box);
  if (a < 0.004) discard;
  // The character sits brighter on its lit square.
  vec3 rgb = mix(vColor.rgb * 0.82, mix(vColor.rgb, vec3(1.0), 0.45 * step(0.01, vShape.y)), ink);
  gl_FragColor = vec4(rgb * a * (1.0 + vShape.z * 0.6), a);
}`;function Ye(o,l,d){let e=o.createShader(l);if(o.shaderSource(e,d),o.compileShader(e),!o.getShaderParameter(e,o.COMPILE_STATUS))throw new Error(o.getShaderInfoLog(e)||"shader failed to compile");return e}function Ve(o,l,d){let e=o.createProgram();if(o.attachShader(e,Ye(o,o.VERTEX_SHADER,l)),o.attachShader(e,Ye(o,o.FRAGMENT_SHADER,d)),o.linkProgram(e),!o.getProgramParameter(e,o.LINK_STATUS))throw new Error(o.getProgramInfoLog(e)||"program failed to link");let u={};for(let p=0,I=o.getProgramParameter(e,o.ACTIVE_UNIFORMS);p<I;p++){let{name:A}=o.getActiveUniform(e,p);u[A]=o.getUniformLocation(e,A)}let g={};for(let p=0,I=o.getProgramParameter(e,o.ACTIVE_ATTRIBUTES);p<I;p++){let{name:A}=o.getActiveAttrib(e,p);g[A]=o.getAttribLocation(e,A)}return{program:e,uniforms:u,attributes:g}}function ct(){let o=document.createElement("canvas");o.width=ee*S,o.height=$e*S;let l=o.getContext("2d",{willReadFrequently:!0});l.fillStyle="#000",l.fillRect(0,0,o.width,o.height),l.fillStyle="#fff",l.font=`600 ${S*.75}px ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace`,l.textAlign="center",l.textBaseline="alphabetic";for(let u=1;u<=ge;u++){let g=u%ee*S+S/2,p=Math.floor(u/ee)*S+S*.76;l.fillText(String.fromCharCode(32+u),g,p)}let d=l.getImageData(0,0,o.width,o.height).data,e=[];for(let u=1;u<=ge;u++){let g=u%ee*S,p=Math.floor(u/ee)*S,I=0;for(let A=p;A<p+S;A+=2)for(let H=g;H<g+S;H+=2)I+=d[(A*o.width+H)*4];e.push({glyph:u,sum:I})}return e.sort((u,g)=>u.sum-g.sum),{canvas:o,ramp:e.map(u=>u.glyph)}}function ve(o,l,d){let e=Math.sin(o*127.1+l*311.7+d*74.7)*43758.5453;return e-Math.floor(e)}function ht(o,{reducedMotion:l=!1}={}){let d=document.createElement("canvas"),e=d.getContext("webgl",{antialias:!1,alpha:!1,powerPreference:"high-performance"});if(!e)return null;let u=ct(),g,p,I,A,H,Fe,Q,Z=null,Se=64;function xe(t){let a=e.createTexture();return e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,t?e.LINEAR_MIPMAP_LINEAR:e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),a}function Ie(){Q&&e.deleteTexture(Q),Z?(Q=xe(!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,Z),e.generateMipmap(e.TEXTURE_2D)):(Q=xe(!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,0])))}function Ce(){g=Ve(e,nt,it),p=Ve(e,st,lt),I=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,I),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),A=e.createBuffer(),H=e.createBuffer(),Se=(e.getParameter(e.ALIASED_POINT_SIZE_RANGE)||[1,64])[1],Fe=xe(!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,u.canvas),e.generateMipmap(e.TEXTURE_2D),Q=null,Ie()}try{Ce()}catch(t){return console.error(t),null}o.appendChild(d);let se=new Image;se.decoding="async",se.onload=()=>{Z=se,!e.isContextLost()&&(Ie(),be(),ne||ae())},se.src=at;let Le=He.map(t=>{let a=[];ze(t).forEach(({text:i,kind:L})=>{for(let s=0;s<i.length;s++)a.push(rt[L])});let n=[],h=0;for(let i=0;i<t.length;i++)t[i]!==" "&&(i===0||t[i-1]===" ")&&(h+=1),n.push(h);return{text:t,weights:a,words:n}}),ye=48,z=9,Ue=window.matchMedia("(pointer: coarse)").matches,Be=Math.min(window.devicePixelRatio||1,Ue?2:1.75),le=Be,y=1,v=1,O=15,D=0,c={x:0,y:0,w:1,h:1},G={x:0,y:0},te=new Float32Array(0),Ae=new Float32Array(0),R=new Float32Array(0),W=new Float32Array(0),q=document.createElement("canvas"),ce=q.getContext("2d",{willReadFrequently:!0});function be(){O=y<600?12:Math.max(13,Math.min(16,Math.round(v/46)));let t=O/2,a=Math.ceil(y/t)+1,n=Math.ceil(v/O)+1,h=(y-a*t)/2,i=(v-n*O)/2,L=y/v;L>=1?(c.h=v,c.w=c.h*We,c.x=y*(.5+.15*Math.min(1,(L-1)/.8))-c.w*pe[0]):(c.w=y*1.34,c.h=c.w/We,c.x=y*.53-c.w*pe[0]),c.y=v-c.h,G.x=c.x+c.w*pe[0],G.y=c.y+c.h*pe[1];let s=null;Z&&(q.width=a*2,q.height=n*2,ce.clearRect(0,0,q.width,q.height),ce.imageSmoothingQuality="high",ce.drawImage(Z,(c.x-h)/t*2,(c.y-i)/O*2,c.w/t*2,c.h/O*2),s=ce.getImageData(0,0,q.width,q.height).data);let V=Math.ceil(a/ye),w=[];for(let f=0;f<n;f++)for(let m=0;m<a;m++){let x=Math.floor(m/ye),F=Le[(f+x*13+(V-x)*5)%Le.length],E=m-x*ye-2,U=E>=0&&E<F.text.length?F.text.charCodeAt(E):32,X=U>32&&U<127?U-32:0,de=X?F.weights[E]:.5,$=ve(X?x*57+F.words[E]:m,f,3),K=0,T=0;if(s){let b=0;for(let _=0;_<2;_++)for(let P=0;P<2;P++){let k=((f*2+_)*q.width+m*2+P)*4;b+=s[k],T+=s[k+3]}T/=1020;let M=Math.min(1,Math.max(0,(b/1020-.03)/.66));K=.1+.9*Math.pow(M*M*(3-2*M),.72)}if(!X&&T<.08)continue;let B=X;if(T>=.08){let b=(ve(m,f,2)-.5)*8;B=u.ramp[Math.min(ge-1,Math.max(0,Math.round(Math.pow(K,.9)*(ge-1)+b)))]}w.push(h+(m+.5)*t,i+(f+.5)*O,ve(m,f,1),X,B,de,K,T,$)}D=w.length/z,te=new Float32Array(D*2),Ae=new Float32Array(D);for(let f=0;f<D;f++)te[f*2]=w[f*z],te[f*2+1]=w[f*z+1],Ae[f]=w[f*z+2];R=new Float32Array(D*3),W=new Float32Array(D*2),e.bindBuffer(e.ARRAY_BUFFER,A),e.bufferData(e.ARRAY_BUFFER,new Float32Array(w),e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,H),e.bufferData(e.ARRAY_BUFFER,R,e.DYNAMIC_DRAW)}function Re(){let t=o.clientWidth||1,a=o.clientHeight||1,n=t!==y||a!==v;y=t,v=a,d.width=Math.round(y*le),d.height=Math.round(v*le),n&&be(),ne||ae()}let r={x:0,y:0,tx:0,ty:0,r:0,inside:!1,lastMove:-1e9,speed:0},C=[],De=t=>{let a=o.getBoundingClientRect();return[t.clientX-a.left,t.clientY-a.top]};function Ne(t){[r.tx,r.ty]=De(t),r.lastMove=performance.now(),r.inside||(r.inside=!0,r.r<4&&(r.x=r.tx,r.y=r.ty))}function ke(){r.inside=!1}function Ke(t){if(l)return;let[a,n]=De(t);C.push({x:a,y:n,born:N,radius:0,strength:1}),C.length>3&&C.shift()}o.addEventListener("pointermove",Ne,{passive:!0}),o.addEventListener("pointerdown",Ne,{passive:!0}),o.addEventListener("pointerleave",ke,{passive:!0}),o.addEventListener("pointercancel",ke,{passive:!0}),o.addEventListener("click",Ke);let oe=l?1:0,Y=oe,we=l?1:0,N=0,je=t=>Math.min(1,Math.max(0,(t-.03)/.57))*(1+Pe),Qe=t=>{let a=Math.min(1,Math.max(0,(t-.62)/.34));return a*a*(3-2*a)};function Ze(t,a){let n=Math.min(88,Math.max(42,Math.min(y,v)*.11)),h=t-r.lastMove>2600,i=0,L=16;r.inside&&!(Ue&&h)?i=n*(1+Math.min(.35,r.speed/2600)):h&&!l&&Y<.12&&(r.tx=G.x+(Math.cos(N*.5)*.17+Math.cos(N*.19)*.06)*v,r.ty=G.y+(.07+Math.sin(N*.67)*.17)*v,i=n*.6*(.55+.45*Math.sin(N*.9)),L=2.4,r.r<2&&(r.x=r.tx,r.y=r.ty));let s=1-Math.exp(-L*a),V=(r.tx-r.x)*s,w=(r.ty-r.y)*s;r.x+=V,r.y+=w,r.speed+=(Math.hypot(V,w)/Math.max(a,.001)-r.speed)*.2,r.r+=(i-r.r)*(1-Math.exp(-(i>r.r?9:5)*a)),r.r<.5&&i===0&&(r.r=0);let f=Math.hypot(y,v);for(let m=C.length-1;m>=0;m--){let x=C[m];x.radius=(N-x.born)*v*1.3,x.strength=Math.max(0,1-x.radius/f),x.strength<=0&&C.splice(m,1)}}function Je(t){let a=r.r,n=a>.5,h=a*3.4,i=h*h,L=v*.09;for(let s=0;s<D;s++){let V=te[s*2],w=te[s*2+1],f=Ae[s],m=R[s*3],x=R[s*3+1],F=R[s*3+2],E=W[s*2],U=W[s*2+1],X=0,de=0,$=0,K=!1;if(n){let B=V-r.x,b=w-r.y,M=B*B+b*b;if(M<i){K=!0;let _=Math.sqrt(M)+.001,P=f>.955?a*.35:a,k=Math.sqrt(Math.sqrt(M*M+P*P*P*P));X=B/_*(k-_),de=b/_*(k-_);let j=(k-a)/(a*.55);$=Math.exp(-j*j)*Math.min(1,a/40)}}for(let B=0;B<C.length;B++){let b=C[B],M=V-b.x,_=w-b.y,P=Math.sqrt(M*M+_*_)+.001,k=Math.abs(P-b.radius);if(k<L){K=!0;let j=(1-k/L)*b.strength;E+=M/P*j*2400*t,U+=_/P*j*2400*t,j*.9>$&&($=j*.9)}}if(!K&&F<.004&&Math.abs(m)+Math.abs(x)<.02&&Math.abs(E)+Math.abs(U)<.5){(m!==0||x!==0||F!==0)&&(R[s*3]=0,R[s*3+1]=0,R[s*3+2]=0,W[s*2]=0,W[s*2+1]=0);continue}let T=9+f*7;E+=(-T*T*(m-X)-T*E)*t,U+=(-T*T*(x-de)-T*U)*t,m+=E*t,x+=U*t,F+=($-F)*($>F?.35:.07),R[s*3]=m,R[s*3+1]=x,R[s*3+2]=F,W[s*2]=E,W[s*2+1]=U}}function ae(){if(e.isContextLost())return;let t=je(Y),a=Qe(Y);e.viewport(0,0,d.width,d.height);let n=g.uniforms;e.useProgram(g.program),e.disable(e.BLEND),e.bindBuffer(e.ARRAY_BUFFER,I),e.enableVertexAttribArray(g.attributes.aPos),e.vertexAttribPointer(g.attributes.aPos,2,e.FLOAT,!1,0,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,Q),e.uniform1i(n.uFigure,0),e.uniform2f(n.uRes,y,v),e.uniform4f(n.uBox,c.x,c.y,c.w,c.h),e.uniform2f(n.uFocus,G.x,G.y),e.uniform3f(n.uPointer,r.x,r.y,r.r);let h=C[C.length-1];if(e.uniform4f(n.uWave,h?h.x:0,h?h.y:0,h?h.radius:0,h?h.strength:0),e.uniform1f(n.uReveal,a),e.uniform1f(n.uScan,t),e.uniform1f(n.uBand,Pe),e.uniform1f(n.uTime,N),e.uniform1f(n.uReady,Z?1:0),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.disableVertexAttribArray(g.attributes.aPos),!D)return;n=p.uniforms;let i=p.attributes;e.useProgram(p.program),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.bindBuffer(e.ARRAY_BUFFER,A),e.enableVertexAttribArray(i.aHome),e.vertexAttribPointer(i.aHome,2,e.FLOAT,!1,z*4,0),e.enableVertexAttribArray(i.aInfo),e.vertexAttribPointer(i.aInfo,4,e.FLOAT,!1,z*4,8),e.enableVertexAttribArray(i.aTone),e.vertexAttribPointer(i.aTone,3,e.FLOAT,!1,z*4,24),e.bindBuffer(e.ARRAY_BUFFER,H),e.bufferSubData(e.ARRAY_BUFFER,0,R),e.enableVertexAttribArray(i.aMove),e.vertexAttribPointer(i.aMove,3,e.FLOAT,!1,0,0),e.bindTexture(e.TEXTURE_2D,Fe),e.uniform1i(n.uAtlas,0),e.uniform2f(n.uRes,y,v),e.uniform2f(n.uFocus,G.x,G.y),e.uniform1f(n.uRatio,le),e.uniform1f(n.uCell,O),e.uniform1f(n.uScan,t),e.uniform1f(n.uBand,Pe),e.uniform1f(n.uReveal,a),e.uniform1f(n.uIntro,we),e.uniform1f(n.uTime,N),e.uniform1f(n.uMaxPoint,Se),e.drawArrays(e.POINTS,0,D),e.disableVertexAttribArray(i.aHome),e.disableVertexAttribArray(i.aInfo),e.disableVertexAttribArray(i.aTone),e.disableVertexAttribArray(i.aMove)}let Ee=0,Te=45,fe=0,Me=0;function et(t){if(Ee>=2||t>200)return;if(Te>0){Te-=1;return}if(Me+=t,fe+=1,fe<60)return;let a=Me/fe;Me=0,fe=0,a>25&&(Ee+=1,le=Ee===1?Math.min(Be,1.15):.85,Te=20,Re())}let re=1/60,ne=!1,ue=!1,ie=!0,_e=0,he=0,me=0;function Oe(t){_e=requestAnimationFrame(Oe),et(t-he);let a=Math.min((t-he)/1e3||re,.1);for(he=t,N+=a,Y+=(oe-Y)*(1-Math.exp(-7*a)),Math.abs(oe-Y)<3e-4&&(Y=oe),we=Math.min(1,we+a/1.5),Ze(t,a),me=Math.min(me+a,re*3);me>=re;)Je(re),me-=re;ae()}function J(t){t&&e.isContextLost()||t!==ne&&(ne=t,cancelAnimationFrame(_e),ne&&(he=performance.now(),_e=requestAnimationFrame(Oe)))}let Ge=new ResizeObserver(Re);Ge.observe(o),Re(),d.addEventListener("webglcontextlost",t=>{t.preventDefault(),J(!1)}),d.addEventListener("webglcontextrestored",()=>{try{Ce()}catch(t){console.error(t);return}be(),ue&&!l?J(ie&&!document.hidden):ae()});let qe=new IntersectionObserver(([t])=>{ie=t.isIntersecting,ue&&!l&&J(ie&&!document.hidden)},{rootMargin:"80px"});qe.observe(o);function Xe(){ue&&!l&&J(ie&&!document.hidden)}return document.addEventListener("visibilitychange",Xe),{start(){ue=!0,o.classList.add("is-live"),l?ae():J(ie&&!document.hidden)},setProgress(t){l||(oe=Math.min(1,Math.max(0,t)))},dispose(){J(!1),qe.disconnect(),Ge.disconnect(),document.removeEventListener("visibilitychange",Xe),d.remove()}}}export{ht as createHero};
