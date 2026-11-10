// Matter.js hero background: floating shapes pulled toward the cursor, wrapping at the edges.
// Needs matter.js, matter-wrap and matter-attractors loaded BEFORE this file.
(function () {
  if (typeof Matter === 'undefined') {
    console.error('Matter.js not loaded. Check the script order in index.html.');
    return;
  }
  Matter.use('matter-attractors');
  Matter.use('matter-wrap');

  const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
  const wrapper = document.getElementById('wrapper-canvas');
  if (!wrapper) return;

  let w = wrapper.clientWidth || window.innerWidth;
  let h = wrapper.clientHeight || window.innerHeight;
  const pr = Math.min(window.devicePixelRatio || 1, 2);

  const engine = Engine.create();
  engine.world.gravity.y = 0;
  engine.world.gravity.x = 0;
  engine.world.gravity.scale = 0;

  const render = Render.create({
    element: wrapper,
    engine: engine,
    options: { width: w, height: h, wireframes: false, background: 'transparent' }
  });
  if (Render.setPixelRatio) Render.setPixelRatio(render, pr);

  // Invisible body that pulls every other body toward itself
  const attractor = Bodies.circle(w / 2, h / 2, 1, {
    isStatic: true,
    isSensor: true,
    render: { visible: false },
    plugin: {
      attractors: [
        function (a, b) {
          return {
            x: (a.position.x - b.position.x) * 1e-6,
            y: (a.position.y - b.position.y) * 1e-6
          };
        }
      ]
    }
  });
  World.add(engine.world, attractor);

  // Shapes
  const colors = ['#1595b6', '#00f0ff', '#1f2667', '#7a00ff', '#d900c7', '#4595eb'];
  const count = Math.max(30, Math.min(110, Math.floor((w * h) / 16000)));
  const shapes = [];
  for (let i = 0; i < count; i++) {
    const size = 6 + Math.random() * 20;
    const opts = {
      frictionAir: 0.01,
      collisionFilter: { group: -1 }, // shapes pass through each other
      render: { fillStyle: colors[i % colors.length], opacity: 0.85 },
      plugin: { wrap: { min: { x: 0, y: 0 }, max: { x: w, y: h } } }
    };
    const x = Math.random() * w;
    const y = Math.random() * h;
    const body = Math.random() < 0.5
      ? Bodies.circle(x, y, size, opts)
      : Bodies.polygon(x, y, 3 + Math.floor(Math.random() * 4), size, opts);
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 });
    shapes.push(body);
  }
  World.add(engine.world, shapes);

  // Pointer tracking on window, so overlaying content never blocks it
  let target = null;
  let lastMove = 0;
  function setTarget(clientX, clientY) {
    const r = wrapper.getBoundingClientRect();
    target = { x: clientX - r.left, y: clientY - r.top };
    lastMove = performance.now();
  }
  window.addEventListener('mousemove', (e) => setTarget(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Move the attractor: follow pointer, otherwise drift slowly so it never looks frozen
  Events.on(engine, 'afterUpdate', function () {
    const t = performance.now();
    let tx, ty;
    if (target && t - lastMove < 3000) {
      tx = target.x; ty = target.y;
    } else {
      tx = w / 2 + Math.sin(t / 2500) * w * 0.3;
      ty = h / 2 + Math.cos(t / 3100) * h * 0.25;
    }
    Body.setPosition(attractor, {
      x: attractor.position.x + (tx - attractor.position.x) * 0.1,
      y: attractor.position.y + (ty - attractor.position.y) * 0.1
    });
  });

  // Resize
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      w = wrapper.clientWidth;
      h = wrapper.clientHeight;
      render.options.width = w;
      render.options.height = h;
      render.bounds.max.x = w;
      render.bounds.max.y = h;
      if (Render.setPixelRatio) Render.setPixelRatio(render, pr);
      shapes.forEach(function (b) { b.plugin.wrap.max = { x: w, y: h }; });
    }, 150);
  });

  Runner.run(Runner.create(), engine);
  Render.run(render);
})();
