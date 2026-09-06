import * as THREE from './assets/three.module.js';

const host = document.getElementById('scene');
const reset = document.getElementById('reset-scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
} catch (error) {
  host.removeAttribute('tabindex');
  host.setAttribute('aria-label', 'GalvanSec graphic');
  document.getElementById('scene-help').textContent = '3D VIEW UNAVAILABLE ON THIS DEVICE';
  reset.disabled = true;
}
if (renderer) initialize(renderer);

function initialize(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  host.classList.add('ready');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
  camera.position.z = 9.2;
  let targetZoom = 9.2;
  const core = new THREE.Group();
  core.rotation.z = -.18;
  scene.add(core);

  // A small local glyph atlas keeps every 3D character in one GPU draw call.
  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = 512; atlasCanvas.height = 32;
  const ctx = atlasCanvas.getContext('2d');
  ctx.font = 'bold 25px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  const glyphs = '01アイウエカキクケサシスセ<> ';
  for (let i = 0; i < 16; i++) ctx.fillText(glyphs[i], i * 32 + 16, 17);
  const atlas = new THREE.CanvasTexture(atlasCanvas);
  atlas.minFilter = THREE.LinearFilter;

  const uniforms = { uTime: { value: 0 }, uHeight: { value: 600 }, uAtlas: { value: atlas }, uPulse: { value: 0 } };
  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aGlyph; attribute float aSize; attribute float aBrightness;
      uniform float uTime; uniform float uHeight; uniform float uPulse;
      varying float vGlyph; varying float vBrightness;
      void main(){
        vec3 p = position * (1.0 + uPulse * 0.055);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * uHeight / -mv.z, 1.0, 24.0);
        vGlyph = mod(aGlyph + floor(uTime * .8 + aBrightness * 3.0), 16.0);
        float sweep = pow(max(0.0, cos(p.y * 2.0 - uTime * .7)), 8.0);
        vBrightness = aBrightness * (.5 + .5 * smoothstep(-2.5, 2.5, p.z)) + sweep * .45;
      }`,
    fragmentShader: `uniform sampler2D uAtlas; varying float vGlyph; varying float vBrightness;
      void main(){
        vec2 uv = vec2((gl_PointCoord.x + vGlyph) / 16.0, 1.0 - gl_PointCoord.y);
        float alpha = texture2D(uAtlas, uv).a;
        if(alpha < .08) discard;
        vec3 color = mix(vec3(.13,.55,.24), vec3(.64,1.0,.46), min(vBrightness,1.0));
        gl_FragColor = vec4(color, alpha * min(vBrightness,1.0));
      }`
  });
  const count = innerWidth < 700 ? 1750 : 2400;
  const positions = [], glyphIndices = [], sizes = [], brightness = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - 2 * i / (count - 1), r = Math.sqrt(1 - y * y), theta = i * golden;
    positions.push(Math.cos(theta) * r * 2.03, y * 2.03, Math.sin(theta) * r * 2.03);
    glyphIndices.push(i % 16); sizes.push(.09 + (i % 3) * .012); brightness.push(.45 + (i % 7) / 10);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aGlyph', new THREE.Float32BufferAttribute(glyphIndices, 1));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aBrightness', new THREE.Float32BufferAttribute(brightness, 1));
  core.add(new THREE.Points(geometry, pointsMaterial));
  const innerMesh = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.95, 2)), new THREE.LineBasicMaterial({ color: 0x52d786, transparent: true, opacity: .095, blending: THREE.AdditiveBlending }));
  core.add(innerMesh);
  const innerDots = new THREE.Points(new THREE.IcosahedronGeometry(1.98, 2), new THREE.PointsMaterial({ color: 0xb9ff9a, size: .016, transparent: true, opacity: .65, blending: THREE.AdditiveBlending }));
  core.add(innerDots);
  // Tilted orbital lines frame the data sphere without obscuring the profile.
  const orbits = new THREE.Group();
  orbits.rotation.set(.45, -.25, -.5);
  core.add(orbits);
  for (let j = 0; j < 3; j++) {
    const points = [];
    const radius = 2.42 + j * .10;
    for (let i = 0; i < 240; i++) { const a = i / 240 * Math.PI * 2; points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: j === 1 ? 0xa6ff82 : 0x429b60, transparent: true, opacity: j === 1 ? .65 : .24 }));
    line.rotation.x = j * .025;
    orbits.add(line);
  }
  const satellite = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd6ffb8 }));
  orbits.add(satellite);
  const arcPositions = [];
  for (let i = 0; i < 95; i++) { const a = i / 95 * Math.PI * 1.2; arcPositions.push(new THREE.Vector3(Math.cos(a) * 2.23, Math.sin(a) * 2.23, 0)); }
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPositions), new THREE.LineBasicMaterial({ color: 0x7dfa89, transparent: true, opacity: .3 }));
  arc.rotation.y = .7; core.add(arc);

  // Perspective code rain: separate columns with their own phase and speed.
  const rainPosition = [], rainGlyph = [], rainSpeed = [], rainPhase = [];
  for (let col = 0; col < 48; col++) {
    const x = (col / 47 - .5) * 14;
    const z = -3 - (col % 5) * .7;
    for (let row = 0; row < 19; row++) {
      rainPosition.push(x, row * .28, z);
      rainGlyph.push((col * 7 + row * 3) % 16);
      rainSpeed.push(.3 + (col % 7) * .075);
      rainPhase.push((col * 2.37) % 12);
    }
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainPosition, 3));
  rainGeometry.setAttribute('aGlyph', new THREE.Float32BufferAttribute(rainGlyph, 1));
  rainGeometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(rainSpeed, 1));
  rainGeometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(rainPhase, 1));
  const rainMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aGlyph;attribute float aSpeed;attribute float aPhase;uniform float uTime;uniform float uHeight;varying float vGlyph;varying float vOpacity;
      void main(){vec3 p=position;p.y=mod(p.y-uTime*aSpeed+aPhase,12.0)-6.0;
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(.14*uHeight/-mv.z,2.0,14.0);
      vGlyph=mod(aGlyph+floor(uTime*.4),16.0);vOpacity=(.11+.2*position.y/5.4)*(1.0-smoothstep(3.0,6.0,abs(p.y)));}`,
    fragmentShader: `uniform sampler2D uAtlas;varying float vGlyph;varying float vOpacity;void main(){float a=texture2D(uAtlas,vec2((gl_PointCoord.x+vGlyph)/16.0,1.0-gl_PointCoord.y)).a;gl_FragColor=vec4(.22,.68,.35,a*vOpacity);}`
  });
  scene.add(new THREE.Points(rainGeometry, rainMaterial));
  // A soft additive halo provides depth; the transparent scene preserves the page grid.
  const haloCanvas = document.createElement('canvas'); haloCanvas.width = haloCanvas.height = 128;
  const hc = haloCanvas.getContext('2d');
  const gradient = hc.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(50,150,70,.32)');gradient.addColorStop(.4,'rgba(30,100,50,.13)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  hc.fillStyle=gradient;hc.fillRect(0,0,128,128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  halo.scale.set(7.3,7.3,1);halo.position.z=-2.2;scene.add(halo);

  let width, height, paused = document.body.classList.contains('motion-paused') || reduced.matches;
  let visible = true, dragging = false, lastX = 0, lastY = 0, pointerStartX = 0, pointerStartY = 0, pointerType = '';
  let targetX = .1, targetY = 0, hoverX = 0, hoverY = 0, time = 0, pulse = 0, lastTime = 0, frame = 0;
  function resize() {
    width = host.clientWidth; height = host.clientHeight;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
    uniforms.uHeight.value=height*renderer.getPixelRatio();
    requestRender();
  }
  function draw(now) {
    frame = 0;
    if (!visible || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((now-lastTime)/1000,.05) : 0; lastTime = now;
    if(!paused) time+=dt;
    uniforms.uTime.value=time;
    pulse *= .93; uniforms.uPulse.value=pulse;
    core.rotation.y += (targetY + (paused?0:time*.065) - core.rotation.y)*.065;
    core.rotation.x += (targetX-core.rotation.x)*.065;
    camera.position.x += (hoverX-camera.position.x)*.035;
    camera.position.y += (hoverY-camera.position.y)*.035;
    camera.position.z += (targetZoom-camera.position.z)*.085;
    camera.lookAt(0,0,0);
    satellite.position.set(Math.cos(time*.35)*2.52,0,Math.sin(time*.35)*2.52);
    renderer.render(scene,camera);
    if(!paused || dragging || Math.abs(core.rotation.x-targetX)>.001 || Math.abs(core.rotation.y-targetY)>.001 || Math.abs(camera.position.z-targetZoom)>.001 || Math.abs(camera.position.x-hoverX)>.001 || Math.abs(camera.position.y-hoverY)>.001 || pulse>.001) {
      // The animated rotation is already evaluated above. A paused view settles then sleeps.
      frame=requestAnimationFrame(draw);
    }
  }
  function requestRender() {if(!frame && visible && !document.hidden) frame=requestAnimationFrame(draw);}
  host.addEventListener('pointerdown', e => {
    if(e.button!==0)return;
    dragging=true;pointerType=e.pointerType;lastX=pointerStartX=e.clientX;lastY=pointerStartY=e.clientY;
    host.classList.add('dragging');host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', e => {
    if(dragging){targetY+=(e.clientX-lastX)*.009;targetX=Math.max(-1,Math.min(1,targetX+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY;requestRender();}
    else if(e.pointerType==='mouse' && !paused){const rect=host.getBoundingClientRect();hoverX=((e.clientX-rect.left)/rect.width-.5)*.35;hoverY=-((e.clientY-rect.top)/rect.height-.5)*.25;requestRender();}
  });
  function release(e){if(dragging && Math.hypot(e.clientX-pointerStartX,e.clientY-pointerStartY)<8){pulse=1;}dragging=false;host.classList.remove('dragging');requestRender();}
  host.addEventListener('pointerup',release);host.addEventListener('pointercancel',()=>{dragging=false;host.classList.remove('dragging');});
  host.addEventListener('pointerleave',()=>{hoverX=0;hoverY=0;requestRender();});
  // Wheel zoom is opt-in by focusing the scene, so normal page scrolling stays usable.
  host.addEventListener('wheel', e => {if(document.activeElement!==host)return;e.preventDefault();targetZoom=Math.max(7,Math.min(12,targetZoom+e.deltaY*.006));requestRender();},{passive:false});
  function resetView(){targetX=.1;targetY=paused?0:-time*.065;targetZoom=9.2;hoverX=hoverY=0;requestRender();}
  reset.addEventListener('click',resetView);
  host.addEventListener('keydown', e => {
    const actions={ArrowLeft:()=>targetY-=.2,ArrowRight:()=>targetY+=.2,ArrowUp:()=>targetX=Math.max(-1,targetX-.15),ArrowDown:()=>targetX=Math.min(1,targetX+.15),'+':()=>targetZoom=Math.max(7,targetZoom-.5),'=':()=>targetZoom=Math.max(7,targetZoom-.5),'-':()=>targetZoom=Math.min(12,targetZoom+.5),r:resetView,R:resetView};
    if(actions[e.key]){e.preventDefault();actions[e.key]();requestRender();}
  });
  host.addEventListener('focus',()=>{document.getElementById('scene-help').textContent='ARROWS ROTATE · + / − ZOOM · R RESET';});
  host.addEventListener('blur',()=>{document.getElementById('scene-help').textContent='DRAG TO ROTATE · CLICK TO ENABLE ZOOM';});
  document.getElementById('scene-help').textContent='DRAG TO ROTATE · CLICK TO ENABLE ZOOM';
  window.addEventListener('portfolio-motion',e=>{
    const wasPaused=paused;paused=e.detail.paused;
    if(paused&&!wasPaused){targetY+=time*.065;}else if(!paused&&wasPaused){targetY-=time*.065;}
    lastTime=0;requestRender();
  });
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible && frame){cancelAnimationFrame(frame);frame=0;lastTime=0;}else requestRender();},{rootMargin:'100px'}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;}else requestRender();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;host.classList.remove('ready');renderer.domElement.style.display='none';reset.disabled=true;document.getElementById('scene-help').textContent='3D VIEW PAUSED — RELOAD TO RESTORE';});
  resize();
}
