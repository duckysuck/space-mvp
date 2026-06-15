const ship = document.getElementById('ship');
const layers = document.querySelectorAll('.background');

const state = {
  y: window.innerHeight / 2,
  vy: 0,
  speed: 280,
  parallax: [0.2, 0.6, 1.2],
  keys: {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  },
};

window.addEventListener('resize', () => {
  state.y = window.innerHeight / 2;
});

window.addEventListener('keydown', (event) => {
  if (state.keys.hasOwnProperty(event.key)) {
    state.keys[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (state.keys.hasOwnProperty(event.key)) {
    state.keys[event.key] = false;
    event.preventDefault();
  }
});

let last = performance.now();
function update(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;

  let moveY = 0;
  if (state.keys.ArrowUp) moveY -= 1;
  if (state.keys.ArrowDown) moveY += 1;

  state.vy += moveY * 1600 * dt;
  state.vy *= 0.92;
  state.y += state.vy * dt;

  const minY = 40;
  const maxY = window.innerHeight - 40;
  state.y = Math.max(minY, Math.min(maxY, state.y));

  ship.style.top = `${state.y}px`;

  const offset = performance.now() * 0.02;
  layers.forEach((layer, index) => {
    const speed = state.parallax[index];
    layer.style.transform = `translateX(${-(offset * speed)}px)`;
  });

  window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);
