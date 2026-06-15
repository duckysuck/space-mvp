const ship = document.getElementById('ship');
const layers = document.querySelectorAll('.background');

const state = {
  x: window.innerWidth * 0.1,
  y: window.innerHeight / 2,
  vx: 0,
  vy: 0,
  startX: window.innerWidth * 0.1,
  speed: 280,
  fireTimer: 0,
  bullets: [],
  parallax: [0.2, 0.6, 1.2],
  keys: {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  },
};

window.addEventListener('resize', () => {
  state.startX = window.innerWidth * 0.1;
  state.x = state.startX;
  state.y = window.innerHeight / 2;
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    state.keys.Space = true;
    event.preventDefault();
    return;
  }

  if (state.keys.hasOwnProperty(event.key)) {
    state.keys[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    state.keys.Space = false;
    event.preventDefault();
    return;
  }

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
  let moveX = 0;
  if (state.keys.ArrowUp) moveY -= 1;
  if (state.keys.ArrowDown) moveY += 1;
  if (state.keys.ArrowLeft) moveX -= 1;
  if (state.keys.ArrowRight) moveX += 1;

  state.vy += moveY * 1600 * dt;
  state.vx += moveX * 1600 * dt;

  const returnForce = (state.startX - state.x) * 3;
  if (!state.keys.ArrowLeft && !state.keys.ArrowRight) {
    state.vx += returnForce * dt;
  }

  state.vy *= 0.92;
  state.vx *= 0.88;

  state.y += state.vy * dt;
  state.x += state.vx * dt;

  const minY = 40;
  const maxY = window.innerHeight - 40;
  state.y = Math.max(minY, Math.min(maxY, state.y));

  const minX = 40;
  const maxX = window.innerWidth - 140;
  state.x = Math.max(minX, Math.min(maxX, state.x));

  ship.style.top = `${state.y}px`;
  ship.style.left = `${state.x}px`;

  state.fireTimer -= dt;
  if (state.keys.Space && state.fireTimer <= 0) {
    fireBullet();
    state.fireTimer = 0.18;
  }

  state.bullets = state.bullets.filter((bullet) => {
    bullet.x += bullet.speed * dt;
    if (bullet.x > window.innerWidth + 20) {
      bullet.element.remove();
      return false;
    }
    bullet.element.style.left = `${bullet.x}px`;
    return true;
  });

  const offset = performance.now() * 0.02;
  layers.forEach((layer, index) => {
    const speed = state.parallax[index];
    layer.style.transform = `translateX(${-(offset * speed)}px)`;
  });

  window.requestAnimationFrame(update);
}

function fireBullet() {
  const bullet = document.createElement('div');
  bullet.className = 'bullet';
  bullet.style.top = `${state.y + 14}px`;
  bullet.style.left = `${state.x + 64}px`;
  document.querySelector('.game-container').appendChild(bullet);

  state.bullets.push({
    element: bullet,
    x: state.x + 64,
    speed: 950,
  });
}

window.requestAnimationFrame(update);
