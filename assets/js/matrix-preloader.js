// Version resolved from https://data.jsdelivr.com/v1/packages/npm/three.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';

export function start(boot) {
  if (boot.done) return;
  const canvas = document.getElementById('matrix-canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, powerPreference:'low-power'}); }
  catch { return; } // Flat boot panel is the accessible WebGL fallback.
  // Customize palette, glyph set, speed and density here. One draw call for all glyphs.
  const green = new THREE.Color('#00ff41'), amber = new THREE.Color('#e9ae56');
  const mobile = innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
  const columns = mobile ? 14 : 52, trail = mobile ? 8 : 18;
  const speed = 2.8;
  const glyphs = [...'アイウエオカキクケコサシスセソ0123456789ABCDEF', 'CVE-', '0x1F', 'AES-256', 'SOC 2', 'NIST', 'ISO 27001', '0/1', 'a9f03c'];
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = 1024;
  const ctx = atlas.getContext('2d');
  if (!ctx) { renderer.dispose(); renderer.forceContextLoss(); return; }
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  glyphs.forEach((glyph,i) => {
    ctx.font = `${glyph.length > 1 ? 20 : 64}px monospace`;
    ctx.fillText(glyph, (i%8)*128+64, Math.floor(i/8)*128+64, 120);
  });
  const texture = new THREE.CanvasTexture(atlas);
  texture.minFilter = THREE.LinearFilter;
  const count = columns * trail;
  const positions = new Float32Array(count*3), tiles = new Float32Array(count), shades = new Float32Array(count), rates = new Float32Array(count);
  for(let c=0;c<columns;c++) {
    const x = (Math.random()-.5)*30, z = -Math.random()*22, y = Math.random()*26;
    const rate = speed*(.6+Math.random());
    for(let j=0;j<trail;j++) {
      const i=c*trail+j;
      new THREE.Vector3(x,y-j*.72,z).toArray(positions,i*3);
      const token = j === 0 && c%5 === 0;
      tiles[i] = token ? glyphs.length-8+(c%8) : Math.floor(Math.random()*(glyphs.length-8));
      shades[i] = token ? -1 : .15+.85*(1-j/trail);
      rates[i] = rate;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('tile',new THREE.BufferAttribute(tiles,1));
  geometry.setAttribute('shade',new THREE.BufferAttribute(shades,1));
  geometry.setAttribute('rate',new THREE.BufferAttribute(rates,1));
  const material = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{atlas:{value:texture},time:{value:0},green:{value:green},amber:{value:amber},pixelRatio:{value:1}},
    vertexShader:`attribute float tile; attribute float shade; attribute float rate;
      uniform float time; uniform float pixelRatio; varying float vTile; varying float vShade;
      void main(){vTile=tile;vShade=shade;vec3 p=position;p.y=mod(p.y-time*rate+16.0,32.0)-16.0;
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((shade<0.0?1150.0:480.0)/(-mv.z),5.0,80.0)*pixelRatio;}`,
    fragmentShader:`uniform sampler2D atlas;uniform vec3 green;uniform vec3 amber;varying float vTile;varying float vShade;
      void main(){vec2 cell=vec2(mod(vTile,8.0),7.0-floor(vTile/8.0));
      vec2 uv=(cell+vec2(gl_PointCoord.x,1.0-gl_PointCoord.y))/8.0;
      float a=texture2D(atlas,uv).a;if(a<0.05)discard;
      gl_FragColor=vec4(vShade<0.0?amber:green,a*(vShade<0.0?0.85:vShade));}`
  });
  const scene = new THREE.Scene(); scene.add(new THREE.Points(geometry,material));
  const camera = new THREE.PerspectiveCamera(52,1,.1,100);
  camera.position.set(0,0,20);
  const pointer = new THREE.Vector2(), target = new THREE.Vector3(0,0,-8);
  renderer.setClearColor('#020805');
  function resize(){
    const ratio = Math.min(devicePixelRatio || 1,mobile ? 1 : 1.5);
    renderer.setPixelRatio(ratio); renderer.setSize(innerWidth,innerHeight,false);
    material.uniforms.pixelRatio.value=ratio;
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  }
  function move(e){pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);}
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function motionChange(e){if(e.matches)boot.hide('reduced-motion');}
  let frame=0,disposed=false;
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);
    removeEventListener('resize',resize);removeEventListener('pointermove',move);motion.removeEventListener('change',motionChange);
    geometry.dispose();material.dispose();texture.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();
  }
  boot.attach(dispose);
  if(disposed)return;
  resize();addEventListener('resize',resize,{passive:true});
  if(!mobile)addEventListener('pointermove',move,{passive:true});
  motion.addEventListener('change',motionChange);
  const started=performance.now();
  function render(now){
    if(disposed)return;
    material.uniforms.time.value=(now-started)/1000;
    camera.position.x += (pointer.x*1.4-camera.position.x)*.04;
    camera.position.y += (-pointer.y*.8-camera.position.y)*.04;
    camera.lookAt(target);renderer.render(scene,camera);frame=requestAnimationFrame(render);
  }
  frame=requestAnimationFrame(render);
}
