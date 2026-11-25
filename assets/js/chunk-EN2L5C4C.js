import"./chunk-O2XFH626.js";var $=[["salvo","Parachute drop"],["dingline","Landing page"],["playbook","Pipeline board"],["morra","Coffee bags"],["salvo","The island from above"],["dingline","It is your turn"],["leads","Lead sources"],["mehrab","Arches"],["salvo","Neon city map"],["dingline","Waiting room TV"],["radar","Radar dashboard"],["ginti","App screens"],["salvo","Flying in"],["dingline","Staff console"],["playbook","Text thread"],["morra","Store home page"],["salvo","Harbour"],["dingline","Order tracking"],["leads","GoHighLevel hub"],["mehrab","Studio home page"],["salvo","Snow base map"],["dingline","Insights"],["ginti","Landing page"],["salvo","Village"],["dingline","Door poster"],["playbook","Booked to showed"],["salvo","Desert town map"],["dingline","Queue ticket in Urdu"],["salvo","Forest"],["dingline","You are next"],["salvo","Neon alley"],["dingline","Staff console on a phone"]];var Re="assets/img/wall-atlas.webp",w=32,de=13,Le=.75,we=`
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
  float index = mod(id.x + id.y * ${de}.0, ${w}.0);
  float col = mod(index, ${8}.0);
  float row = floor(index / ${8}.0);
  vec2 t = clamp((f - 0.5) * size / (2.0 * inner) + 0.5, 0.006, 0.994);
  vec2 uv = vec2((col + t.x) / ${8}.0, 1.0 - (row + t.y) / ${4}.0);
  vec3 picture = mix(vec3(0.17), texture2D(uAtlas, uv).rgb, uReady);

  // Tiles near the lens are lit; the rest of the wall sits in the dark.
  float glow = exp(-u * 0.55) * uLit;
  float light = mix(0.1, 1.0, glow);

  gl_FragColor = vec4(mix(GROUND, picture * light, inside), 1.0);
}`;function se(i,v,E){let d=i.createShader(v);if(i.shaderSource(d,E),i.compileShader(d),!i.getShaderParameter(d,i.COMPILE_STATUS))throw new Error(i.getShaderInfoLog(d)||"shader failed to compile");return d}var M=(i,v,E)=>Math.min(E,Math.max(v,i));function be(i,{reducedMotion:v=!1,onOpen:E}={}){let d=i.querySelector("[data-wall-canvas]"),f=i.querySelector("[data-wall-label]"),s=i.querySelector("[data-wall-card]");if(!d)return null;let g=document.createElement("canvas"),e=g.getContext("webgl",{antialias:!1,alpha:!1,powerPreference:"high-performance"});if(!e)return null;let m,h={};try{if(m=e.createProgram(),e.attachShader(m,se(e,e.VERTEX_SHADER,we)),e.attachShader(m,se(e,e.FRAGMENT_SHADER,Se)),e.bindAttribLocation(m,0,"aPos"),e.linkProgram(m),!e.getProgramParameter(m,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(m)||"program failed to link")}catch(t){return console.error(t),null}let ue=e.getProgramParameter(m,e.ACTIVE_UNIFORMS);for(let t=0;t<ue;t++){let{name:o}=e.getActiveUniform(m,t);h[o]=e.getUniformLocation(m,o)}e.useProgram(m),d.appendChild(g);let fe=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,fe),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let V=e.createTexture();e.bindTexture(e.TEXTURE_2D,V),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([44,44,44,255]));let Y=!1,S=new Image;S.decoding="async",S.onload=()=>{e.bindTexture(e.TEXTURE_2D,V),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,S),e.generateMipmap(e.TEXTURE_2D),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),Y=!0},S.src=Re;let me=window.matchMedia("(pointer: coarse)").matches,j=Math.min(window.devicePixelRatio||1,me?2:1.5),A=j,x=1,y=1,T=20,L=15,D=200;function k(){x=d.clientWidth||1,y=d.clientHeight||1,g.width=Math.round(x*A),g.height=Math.round(y*A),T=M(x/60,12,23),L=T*Le,D=M(Math.min(x,y)*.3,92,230)}let K=new ResizeObserver(k);K.observe(d),k();let n={x:x/2,y:y/2,tx:x/2,ty:y/2,power:0,sigma:D},u={x:0,y:0,speed:0},_=!1,c=!1,F=-1,q=0,N=0,Q=(t,o)=>{let a=t-n.x,r=o-n.y,l=(a*a+r*r)/(n.sigma*n.sigma),p=1-n.power*Math.exp(-l*l);return{col:Math.floor((n.x+a*p+u.x)/T),row:Math.floor((n.y+r*p+u.y)/L)}},J=({col:t,row:o})=>((t+o*de)%w+w)%w,Z=t=>document.querySelector(`[data-project="${t}"]`),R=(t,o)=>{let a=t&&t.querySelector(o);return a?a.textContent.trim():""},he=f&&f.querySelector("[data-wall-caption]"),pe=f&&f.querySelector("[data-wall-project]"),ge=f&&f.querySelector("[data-wall-type]");function xe(t){if(!f)return;let[o,a]=$[t],r=Z(o);he.textContent=a,pe.textContent=R(r,"h3")||o,ge.textContent=R(r,".card__type")}function ye(){if(!f)return;let t=L/(1-n.power)/2,o=f.offsetWidth,a=f.offsetHeight,r=M(n.x-o/2,12,Math.max(12,x-o-12)),l=n.y+t+14;l+a>y-12&&(l=n.y-t-14-a),f.style.transform=`translate3d(${r.toFixed(1)}px, ${M(l,12,y-a-12).toFixed(1)}px, 0)`}function ve(t){if(!s)return;let[o,a]=$[t],r=Z(o);s.querySelector("[data-card-type]").textContent=R(r,".card__type"),s.querySelector("[data-card-status]").textContent=R(r,".tag"),s.querySelector("[data-card-title]").textContent=R(r,"h3")||o,s.querySelector("[data-card-screen]").textContent=a,s.querySelector("[data-card-text]").textContent=R(r,".card__info p");let l=s.querySelector("[data-card-link]"),p=r&&r.getAttribute("href");p?(l.href=p,l.target="_blank",l.rel="noopener",l.firstElementChild.textContent=r.dataset.open||"Open the concept",l.onclick=null):(l.href="#work",l.removeAttribute("target"),l.removeAttribute("rel"),l.firstElementChild.textContent="Show it in Work",l.onclick=le=>{le.preventDefault(),le.stopPropagation(),E&&r&&E(r)})}function b(t,o){c=t,i.classList.toggle("is-pinned",c),s&&(c&&(ve(o),s.hidden=!1),s.classList.toggle("is-open",c),s.setAttribute("aria-hidden",String(!c)),s.inert=!c)}function ee(t){let o=d.getBoundingClientRect();return{x:t.clientX-o.left,y:t.clientY-o.top}}function te(t){if(c)return;let{x:o,y:a}=ee(t);n.tx=o,n.ty=a,_||(_=!0,i.classList.add("is-active"))}function oe(){_=!1,i.classList.remove("is-active")}function Ee(t){if(t.target.closest("[data-wall-card]"))return;if(c){b(!1);return}let{x:o,y:a}=ee(t),r=Q(o,a);n.tx=(r.col+.5)*T-u.x,n.ty=(r.row+.5)*L-u.y,b(!0,J(r))}function ne(t){t.key==="Escape"&&c&&b(!1)}if(i.addEventListener("pointermove",te,{passive:!0}),i.addEventListener("pointerdown",te,{passive:!0}),i.addEventListener("pointerleave",oe,{passive:!0}),i.addEventListener("pointercancel",oe,{passive:!0}),i.addEventListener("click",Ee),document.addEventListener("keydown",ne),s){s.inert=!0;let t=s.querySelector("[data-card-close]");t&&t.addEventListener("click",()=>b(!1))}let W=0,O=45,P=0,X=0;function Te(t){if(W>=2||t>200)return;if(O>0){O-=1;return}if(X+=t,P+=1,P<60)return;let o=X/P;X=0,P=0,o>25&&(W+=1,A=W===1?Math.min(j,1):.75,O=20,k())}let G=!1,B=!1,z=0,C=0,I=0;function re(t){z=requestAnimationFrame(re),Te(t-C);let o=Math.min((t-C)/1e3||1/60,.1);C=t,I+=o;let a=!_&&!c&&!v;a&&(n.tx=x*(.5+Math.cos(I*.31)*.27+Math.cos(I*.13)*.08),n.ty=y*(.52+Math.sin(I*.43)*.2));let r=1-Math.exp(-(a?1.8:c?5:11)*o);n.x+=(n.tx-n.x)*r,n.y+=(n.ty-n.y)*r;let l=1-Math.exp(-3.2*o);if(n.power+=((c?.92:.885)-n.power)*l,n.sigma+=(D*(c?1.4:1)-n.sigma)*l,q+=((Y?1:0)-q)*(1-Math.exp(-2.5*o)),N+=(1-N)*(1-Math.exp(-1.6*o)),u.speed+=((a?7:0)-u.speed)*(1-Math.exp(-2*o)),u.x=(u.x+u.speed*o)%(T*w),!v&&!c){let p=d.getBoundingClientRect().top;u.y=Math.round(-p*.08)}if(!c){let p=J(Q(n.x,n.y));p!==F&&(F=p,xe(F)),ye()}e.viewport(0,0,g.width,g.height),e.uniform1i(h.uAtlas,0),e.uniform2f(h.uRes,g.width,g.height),e.uniform1f(h.uRatio,A),e.uniform2f(h.uLens,n.x,n.y),e.uniform1f(h.uPower,n.power),e.uniform1f(h.uSigma,n.sigma),e.uniform2f(h.uCell,T,L),e.uniform2f(h.uShift,u.x,u.y),e.uniform1f(h.uReady,q),e.uniform1f(h.uLit,N),e.drawArrays(e.TRIANGLE_STRIP,0,4)}function H(t){t!==G&&(G=t,cancelAnimationFrame(z),G&&(C=performance.now(),z=requestAnimationFrame(re)))}let ae=new IntersectionObserver(([t])=>{B=t.isIntersecting,H(B&&!document.hidden)},{rootMargin:"60px"});ae.observe(d);function ie(){H(B&&!document.hidden)}return document.addEventListener("visibilitychange",ie),i.classList.add("is-live"),{dispose(){H(!1),ae.disconnect(),K.disconnect(),document.removeEventListener("visibilitychange",ie),document.removeEventListener("keydown",ne),g.remove()}}}export{be as createWall};
