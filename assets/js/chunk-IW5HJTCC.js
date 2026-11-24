import"./chunk-O2XFH626.js";var H=[["salvo","Parachute drop"],["dingline","Landing page"],["quran","Live pointer"],["morra","Coffee bags"],["salvo","The island from above"],["dingline","It is your turn"],["quran","Teacher lobby"],["mehrab","Arches"],["salvo","Neon city map"],["dingline","Waiting room TV"],["quran","Class list"],["ginti","App screens"],["salvo","Flying in"],["dingline","Staff console"],["quran","Invite a student"],["morra","Store home page"],["salvo","Harbour"],["dingline","Order tracking"],["quran","Student lobby"],["mehrab","Studio home page"],["salvo","Snow base map"],["dingline","Insights"],["quran","Settings"],["ginti","Landing page"],["salvo","Village"],["dingline","Door poster"],["salvo","Desert town map"],["dingline","Queue ticket in Urdu"],["salvo","Forest"],["dingline","You are next"],["salvo","Neon alley"],["dingline","Staff console on a phone"]];var Re="assets/img/wall-atlas.webp",w=32,ue=13,Le=.75,we=`
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,Se=`
precision highp float;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform float uRatio;
uniform vec2 uLens;
uniform float uPower;
uniform float uSigma;
uniform vec2 uCell;
uniform vec2 uShift;
uniform float uReady;
uniform float uLit;

const vec3 GROUND = vec3(0.020, 0.020, 0.024);

void main() {
  // CSS pixels from the top-left corner of the stage, like the page measures things.
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRatio;
  vec2 d = p - uLens;
  float u = dot(d, d) / (uSigma * uSigma);

  // The lens: flat in the middle, falling away fast at the rim, which squeezes the
  // tiles just outside it the way a glass ball would.
  float bump = uPower * exp(-u * u);
  vec2 s = uLens + d * (1.0 - bump) + uShift;
  vec2 g = s / uCell;
  vec2 id = floor(g);
  vec2 f = g - id;

  // Rounded tile, sized for how large it appears at this spot.
  vec2 size = uCell / (1.0 - bump);
  float gap = max(0.8, min(size.x, size.y) * 0.04);
  vec2 inner = size * 0.5 - gap;
  float radius = min(inner.x, inner.y) * 0.26;
  vec2 q = abs((f - 0.5) * size) - inner + radius;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float inside = 1.0 - smoothstep(-0.5, 0.5, sd * uRatio);

  // Which picture: the sheet is read left to right, and every row starts further along.
  float index = mod(id.x + id.y * ${ue}.0, ${w}.0);
  float col = mod(index, ${8}.0);
  float row = floor(index / ${8}.0);
  vec2 t = clamp((f - 0.5) * size / (2.0 * inner) + 0.5, 0.006, 0.994);
  vec2 uv = vec2((col + t.x) / ${8}.0, 1.0 - (row + t.y) / ${4}.0);
  vec3 picture = mix(vec3(0.17), texture2D(uAtlas, uv).rgb, uReady);

  // Tiles near the lens are lit; the rest of the wall sits in the dark.
  float glow = exp(-u * 0.55) * uLit;
  float light = mix(0.1, 1.0, glow);

  gl_FragColor = vec4(mix(GROUND, picture * light, inside), 1.0);
}`;function se(a,y,E){let u=a.createShader(y);if(a.shaderSource(u,E),a.compileShader(u),!a.getShaderParameter(u,a.COMPILE_STATUS))throw new Error(a.getShaderInfoLog(u)||"shader failed to compile");return u}var M=(a,y,E)=>Math.min(E,Math.max(y,a));function be(a,{reducedMotion:y=!1,onOpen:E}={}){let u=a.querySelector("[data-wall-canvas]"),f=a.querySelector("[data-wall-label]"),s=a.querySelector("[data-wall-card]");if(!u)return null;let g=document.createElement("canvas"),e=g.getContext("webgl",{antialias:!1,alpha:!1,powerPreference:"high-performance"});if(!e)return null;let m,h={};try{if(m=e.createProgram(),e.attachShader(m,se(e,e.VERTEX_SHADER,we)),e.attachShader(m,se(e,e.FRAGMENT_SHADER,Se)),e.bindAttribLocation(m,0,"aPos"),e.linkProgram(m),!e.getProgramParameter(m,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(m)||"program failed to link")}catch(t){return console.error(t),null}let de=e.getProgramParameter(m,e.ACTIVE_UNIFORMS);for(let t=0;t<de;t++){let{name:n}=e.getActiveUniform(m,t);h[n]=e.getUniformLocation(m,n)}e.useProgram(m),u.appendChild(g);let fe=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,fe),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let V=e.createTexture();e.bindTexture(e.TEXTURE_2D,V),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([44,44,44,255]));let Y=!1,S=new Image;S.decoding="async",S.onload=()=>{e.bindTexture(e.TEXTURE_2D,V),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,S),e.generateMipmap(e.TEXTURE_2D),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),Y=!0},S.src=Re;let me=window.matchMedia("(pointer: coarse)").matches,j=Math.min(window.devicePixelRatio||1,me?2:1.5),A=j,x=1,v=1,T=20,L=15,q=200;function D(){x=u.clientWidth||1,v=u.clientHeight||1,g.width=Math.round(x*A),g.height=Math.round(v*A),T=M(x/60,12,23),L=T*Le,q=M(Math.min(x,v)*.3,92,230)}let K=new ResizeObserver(D);K.observe(u),D();let o={x:x/2,y:v/2,tx:x/2,ty:v/2,power:0,sigma:q},d={x:0,y:0,speed:0},_=!1,c=!1,F=-1,k=0,N=0,Q=(t,n)=>{let i=t-o.x,r=n-o.y,l=(i*i+r*r)/(o.sigma*o.sigma),p=1-o.power*Math.exp(-l*l);return{col:Math.floor((o.x+i*p+d.x)/T),row:Math.floor((o.y+r*p+d.y)/L)}},J=({col:t,row:n})=>((t+n*ue)%w+w)%w,Z=t=>document.querySelector(`[data-project="${t}"]`),R=(t,n)=>{let i=t&&t.querySelector(n);return i?i.textContent.trim():""},he=f&&f.querySelector("[data-wall-caption]"),pe=f&&f.querySelector("[data-wall-project]"),ge=f&&f.querySelector("[data-wall-type]");function xe(t){if(!f)return;let[n,i]=H[t],r=Z(n);he.textContent=i,pe.textContent=R(r,"h3")||n,ge.textContent=R(r,".card__type")}function ve(){if(!f)return;let t=L/(1-o.power)/2,n=f.offsetWidth,i=f.offsetHeight,r=M(o.x-n/2,12,Math.max(12,x-n-12)),l=o.y+t+14;l+i>v-12&&(l=o.y-t-14-i),f.style.transform=`translate3d(${r.toFixed(1)}px, ${M(l,12,v-i-12).toFixed(1)}px, 0)`}function ye(t){if(!s)return;let[n,i]=H[t],r=Z(n);s.querySelector("[data-card-type]").textContent=R(r,".card__type"),s.querySelector("[data-card-status]").textContent=R(r,".tag"),s.querySelector("[data-card-title]").textContent=R(r,"h3")||n,s.querySelector("[data-card-screen]").textContent=i,s.querySelector("[data-card-text]").textContent=R(r,".card__info p");let l=s.querySelector("[data-card-link]"),p=r&&r.getAttribute("href");p?(l.href=p,l.target="_blank",l.rel="noopener",l.firstElementChild.textContent="Open the concept",l.onclick=null):(l.href="#work",l.removeAttribute("target"),l.removeAttribute("rel"),l.firstElementChild.textContent="Show it in Work",l.onclick=le=>{le.preventDefault(),le.stopPropagation(),E&&r&&E(r)})}function b(t,n){c=t,a.classList.toggle("is-pinned",c),s&&(c&&(ye(n),s.hidden=!1),s.classList.toggle("is-open",c),s.setAttribute("aria-hidden",String(!c)),s.inert=!c)}function ee(t){let n=u.getBoundingClientRect();return{x:t.clientX-n.left,y:t.clientY-n.top}}function te(t){if(c)return;let{x:n,y:i}=ee(t);o.tx=n,o.ty=i,_||(_=!0,a.classList.add("is-active"))}function ne(){_=!1,a.classList.remove("is-active")}function Ee(t){if(t.target.closest("[data-wall-card]"))return;if(c){b(!1);return}let{x:n,y:i}=ee(t),r=Q(n,i);o.tx=(r.col+.5)*T-d.x,o.ty=(r.row+.5)*L-d.y,b(!0,J(r))}function oe(t){t.key==="Escape"&&c&&b(!1)}if(a.addEventListener("pointermove",te,{passive:!0}),a.addEventListener("pointerdown",te,{passive:!0}),a.addEventListener("pointerleave",ne,{passive:!0}),a.addEventListener("pointercancel",ne,{passive:!0}),a.addEventListener("click",Ee),document.addEventListener("keydown",oe),s){s.inert=!0;let t=s.querySelector("[data-card-close]");t&&t.addEventListener("click",()=>b(!1))}let W=0,O=45,C=0,X=0;function Te(t){if(W>=2||t>200)return;if(O>0){O-=1;return}if(X+=t,C+=1,C<60)return;let n=X/C;X=0,C=0,n>25&&(W+=1,A=W===1?Math.min(j,1):.75,O=20,D())}let G=!1,B=!1,z=0,P=0,I=0;function re(t){z=requestAnimationFrame(re),Te(t-P);let n=Math.min((t-P)/1e3||1/60,.1);P=t,I+=n;let i=!_&&!c&&!y;i&&(o.tx=x*(.5+Math.cos(I*.31)*.27+Math.cos(I*.13)*.08),o.ty=v*(.52+Math.sin(I*.43)*.2));let r=1-Math.exp(-(i?1.8:c?5:11)*n);o.x+=(o.tx-o.x)*r,o.y+=(o.ty-o.y)*r;let l=1-Math.exp(-3.2*n);if(o.power+=((c?.92:.885)-o.power)*l,o.sigma+=(q*(c?1.4:1)-o.sigma)*l,k+=((Y?1:0)-k)*(1-Math.exp(-2.5*n)),N+=(1-N)*(1-Math.exp(-1.6*n)),d.speed+=((i?7:0)-d.speed)*(1-Math.exp(-2*n)),d.x=(d.x+d.speed*n)%(T*w),!y&&!c){let p=u.getBoundingClientRect().top;d.y=Math.round(-p*.08)}if(!c){let p=J(Q(o.x,o.y));p!==F&&(F=p,xe(F)),ve()}e.viewport(0,0,g.width,g.height),e.uniform1i(h.uAtlas,0),e.uniform2f(h.uRes,g.width,g.height),e.uniform1f(h.uRatio,A),e.uniform2f(h.uLens,o.x,o.y),e.uniform1f(h.uPower,o.power),e.uniform1f(h.uSigma,o.sigma),e.uniform2f(h.uCell,T,L),e.uniform2f(h.uShift,d.x,d.y),e.uniform1f(h.uReady,k),e.uniform1f(h.uLit,N),e.drawArrays(e.TRIANGLE_STRIP,0,4)}function $(t){t!==G&&(G=t,cancelAnimationFrame(z),G&&(P=performance.now(),z=requestAnimationFrame(re)))}let ie=new IntersectionObserver(([t])=>{B=t.isIntersecting,$(B&&!document.hidden)},{rootMargin:"60px"});ie.observe(u);function ae(){$(B&&!document.hidden)}return document.addEventListener("visibilitychange",ae),a.classList.add("is-live"),{dispose(){$(!1),ie.disconnect(),K.disconnect(),document.removeEventListener("visibilitychange",ae),document.removeEventListener("keydown",oe),g.remove()}}}export{be as createWall};
