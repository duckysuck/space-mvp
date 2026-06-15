const ship = document.getElementById('ship');
const layers = document.querySelectorAll('.background');
const scoreValue = document.getElementById('scoreValue');
const chargeFill = document.getElementById('chargeFill');
const healthFill = document.getElementById('healthFill');
const weaponReady = document.getElementById('weaponReady');

const defaultConfig = {
  movement: {
    horizontal_acceleration: 1600,
    vertical_acceleration: 1600,
    horizontal_friction: 0.88,
    vertical_friction: 0.92,
    center_assist_strength: 3,
    min_x: 40,
    max_x_offset: 140,
    min_y: 40,
    max_y_offset: 40,
  },
  weapon: {
    fire_rate: 0.18,
    bullet_speed: 950,
    charge_rate: 18,
    charge_max: 100,
  },
  controls: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    fire: 'Space',
  },
  hud: {
    health_max: 100,
    charge_ready_text: 'READY',
    charge_charging_text: 'CHARGING',
  },
};

const state = {
  x: window.innerWidth * 0.1,
  y: window.innerHeight / 2,
  vx: 0,
  vy: 0,
  startX: window.innerWidth * 0.1,
  fireTimer: 0,
  bullets: [],
  parallax: [0.2, 0.6, 1.2],
  keys: {},
  config: defaultConfig,
  score: 0,
  health: 100,
  charge: 0,
};

function parseIni(text) {
  const result = {};
  let section = null;
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      return;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      section = trimmed.slice(1, -1);
      result[section] = {};
      return;
    }
    if (!section) return;
    const [key, ...rest] = trimmed.split('=');
    if (!key || rest.length === 0) return;
    const value = rest.join('=').trim();
    const num = Number(value);
    result[section][key.trim()] = Number.isNaN(num) ? value : num;
  });
  return result;
}

function mergeConfig(base, incoming) {
  const merged = JSON.parse(JSON.stringify(base));
  Object.keys(incoming).forEach((section) => {
    if (!merged[section]) merged[section] = {};
    Object.keys(incoming[section]).forEach((key) => {
      merged[section][key] = incoming[section][key];
    });
  });
  return merged;
}

async function loadConfig() {
  try {
    const response = await fetch('config.ini');
    if (!response.ok) throw new Error('Unable to load config.ini');
    const text = await response.text();
    const parsed = parseIni(text);
    state.config = mergeConfig(defaultConfig, parsed);
  } catch (err) {
    console.warn('Config load failed, using defaults.', err);
    state.config = defaultConfig;
  }
  initializeControls();
}

function initializeControls() {
  state.keys = {
    [state.config.controls.up]: false,
    [state.config.controls.down]: false,
    [state.config.controls.left]: false,
    [state.config.controls.right]: false,
    [state.config.controls.fire]: false,
  };
}

window.addEventListener('resize', () => {
  state.startX = window.innerWidth * 0.1;
  state.x = state.startX;
  state.y = window.innerHeight / 2;
});

window.addEventListener('keydown', (event) => {
  if (event.code === state.config.controls.fire) {
    state.keys[state.config.controls.fire] = true;
    event.preventDefault();
    return;
  }

  if (state.keys.hasOwnProperty(event.key)) {
    state.keys[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === state.config.controls.fire) {
    state.keys[state.config.controls.fire] = false;
    event.preventDefault();
    return;
  }

  if (state.keys.hasOwnProperty(event.key)) {
    state.keys[event.key] = false;
    event.preventDefault();
  }
});

function updateHud() {
  scoreValue.textContent = state.score.toString().padStart(4, '0');
  const chargePercent = Math.min(100, (state.charge / state.config.weapon.charge_max) * 100);
  chargeFill.style.width = `${chargePercent}%`;
  healthFill.style.width = `${Math.max(0, (state.health / state.config.hud.health_max) * 100)}%`;
  if (state.charge >= state.config.weapon.charge_max) {
    weaponReady.textContent = state.config.hud.charge_ready_text;
    weaponReady.classList.add('ready');
  } else {
    weaponReady.textContent = state.config.hud.charge_charging_text;
    weaponReady.classList.remove('ready');
  }
}

let last = performance.now();
function update(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;

  const controls = state.config.controls;
  let moveY = 0;
  let moveX = 0;
  if (state.keys[controls.up]) moveY -= 1;
  if (state.keys[controls.down]) moveY += 1;
  if (state.keys[controls.left]) moveX -= 1;
  if (state.keys[controls.right]) moveX += 1;

  state.vy += moveY * state.config.movement.vertical_acceleration * dt;
  state.vx += moveX * state.config.movement.horizontal_acceleration * dt;

  const returnForce = (state.startX - state.x) * state.config.movement.center_assist_strength;
  if (!state.keys[controls.left] && !state.keys[controls.right]) {
    state.vx += returnForce * dt;
  }

  state.vy *= state.config.movement.vertical_friction;
  state.vx *= state.config.movement.horizontal_friction;

  state.y += state.vy * dt;
  state.x += state.vx * dt;

  const minY = state.config.movement.min_y;
  const maxY = window.innerHeight - state.config.movement.max_y_offset;
  state.y = Math.max(minY, Math.min(maxY, state.y));

  const minX = state.config.movement.min_x;
  const maxX = window.innerWidth - state.config.movement.max_x_offset;
  state.x = Math.max(minX, Math.min(maxX, state.x));

  ship.style.top = `${state.y}px`;
  ship.style.left = `${state.x}px`;

  state.fireTimer -= dt;
  if (state.keys[controls.fire] && state.fireTimer <= 0) {
    fireBullet();
    state.fireTimer = state.config.weapon.fire_rate;
  }

  state.charge = Math.min(state.config.weapon.charge_max, state.charge + state.config.weapon.charge_rate * dt);
  if (state.charge >= state.config.weapon.charge_max) {
    state.charge = state.config.weapon.charge_max;
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

  updateHud();
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
    speed: state.config.weapon.bullet_speed,
  });
  state.score += 10;
}

loadConfig().then(() => {
  window.requestAnimationFrame(update);
});
