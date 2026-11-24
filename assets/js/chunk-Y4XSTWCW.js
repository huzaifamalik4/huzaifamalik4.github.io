import"./chunk-O2XFH626.js";var F=`
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,R=`
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uRadius;
uniform float uWidth;
uniform float uTime;
uniform float uFade;
uniform float uFill;
uniform vec3 uPaper;
uniform vec3 uGlow;

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

// A soap-film run of colour: violet, cyan, mint, pink, and round again.
vec3 sheen(float t) {
  float s = fract(t) * 4.0;
  vec3 violet = vec3(0.62, 0.48, 1.0);
  vec3 cyan = vec3(0.38, 0.9, 1.0);
  vec3 mint = vec3(0.58, 1.0, 0.76);
  vec3 pink = vec3(1.0, 0.72, 0.94);
  vec3 color = mix(violet, cyan, smoothstep(0.0, 1.0, s));
  color = mix(color, mint, smoothstep(1.0, 2.0, s));
  color = mix(color, pink, smoothstep(2.0, 3.0, s));
  return mix(color, violet, smoothstep(3.0, 4.0, s));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float dist = distance(p, uOrigin);

  // The front ripples a little, so it reads as light through water, not a drawn circle.
  float ripple = noise(p / uWidth * 0.9 + vec2(uTime * 0.35, -uTime * 0.2)) - 0.5;
  float x = (dist - uRadius) / uWidth + ripple * 0.7;

  float core = exp(-x * x * 6.0);
  float halo = exp(-x * x * 0.85);

  // The colours fan out across the band like light split by glass.
  float phase = x * 0.36 + ripple * 0.5 + uTime * 0.07;
  vec3 band = mix(sheen(phase), vec3(1.0), 0.1 + 0.62 * core);
  float bandAlpha = clamp(core * 0.9 + halo * 0.46, 0.0, 1.0);

  // Behind the front, a glow in the new theme's colour fades away.
  float behind = clamp(-x, 0.0, 8.0);
  float glowAlpha = step(x, 0.0) * exp(-behind * behind * 0.12) * 0.42;

  // Where the browser cannot blend two snapshots of the page, the area behind the
  // front is painted in the new page colour instead.
  float fillAlpha = uFill * smoothstep(0.6, -0.6, x);

  vec3 rgb = uPaper * fillAlpha;
  float alpha = fillAlpha;
  rgb = uGlow * glowAlpha + rgb * (1.0 - glowAlpha);
  alpha = glowAlpha + alpha * (1.0 - glowAlpha);
  rgb = band * bandAlpha + rgb * (1.0 - bandAlpha);
  alpha = bandAlpha + alpha * (1.0 - bandAlpha);

  gl_FragColor = vec4(rgb, alpha) * uFade;
}`;function w(a,e,r){let t=a.createShader(e);if(a.shaderSource(t,r),a.compileShader(t),!a.getShaderParameter(t,a.COMPILE_STATUS))throw new Error(a.getShaderInfoLog(t)||"shader failed to compile");return t}var E={light:[.933,.929,.91],dark:[.043,.043,.047]},P={light:[.86,.8,1],dark:[.27,.95,.66]};function S(){let a=document.createElement("canvas");a.className="prism",a.setAttribute("aria-hidden","true");let e=a.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!e)return null;let r=e.createProgram(),t={};try{if(e.attachShader(r,w(e,e.VERTEX_SHADER,F)),e.attachShader(r,w(e,e.FRAGMENT_SHADER,R)),e.bindAttribLocation(r,0,"aPos"),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(r)||"program failed to link")}catch(o){return console.error(o),null}let b=e.getProgramParameter(r,e.ACTIVE_UNIFORMS);for(let o=0;o<b;o++){let{name:i}=e.getActiveUniform(r,o);t[i]=e.getUniformLocation(r,i)}e.useProgram(r);let x=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,x),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),document.body.appendChild(a);let n=0;function A({x:o,y:i,radius:c,width:s,time:h,fade:f,fill:u,theme:l}){e.viewport(0,0,a.width,a.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.uniform2f(t.uRes,a.width,a.height),e.uniform2f(t.uOrigin,o*.5,i*.5),e.uniform1f(t.uRadius,c*.5),e.uniform1f(t.uWidth,s*.5),e.uniform1f(t.uTime,h),e.uniform1f(t.uFade,f),e.uniform1f(t.uFill,u?1:0),e.uniform3fv(t.uPaper,E[l]),e.uniform3fv(t.uGlow,P[l]),e.drawArrays(e.TRIANGLE_STRIP,0,4)}return{prepare(){a.width=Math.max(2,Math.round(window.innerWidth*.5)),a.height=Math.max(2,Math.round(window.innerHeight*.5)),e.viewport(0,0,a.width,a.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT)},play({x:o,y:i,reach:c,width:s,duration:h,ease:f,theme:u,fill:l=!1}){return cancelAnimationFrame(n),new Promise(d=>{let m=performance.now(),p=g=>{let v=Math.min(1,(g-m)/h);A({x:o,y:i,radius:f(v)*c,width:s,time:(g-m)/1e3,fade:1,fill:l,theme:u}),v<1?n=requestAnimationFrame(p):d()};n=requestAnimationFrame(p)})},fadeOut({x:o,y:i,reach:c,width:s,duration:h,theme:f}){return cancelAnimationFrame(n),new Promise(u=>{let l=performance.now(),d=m=>{let p=Math.min(1,(m-l)/h);A({x:o,y:i,radius:c,width:s,time:2+(m-l)/1e3,fade:1-p,fill:!0,theme:f}),p<1?n=requestAnimationFrame(d):u()};n=requestAnimationFrame(d)})},stop(){cancelAnimationFrame(n)}}}export{S as createPrism};
