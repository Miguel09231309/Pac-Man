const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const eatSound = document.getElementById("eatSound");

let pac = { x: 200, y: 200, size: 15, dx: 0, dy: 0 };
let ghosts = [];
let dots = [];
let powerUps = [];
let score = 0;
let lives = 3;
let level = 1;
let frightened = false;
let frightenedTimer = 0;

let highscore = localStorage.getItem("pacmanHighscore") || 0;
highscoreEl.textContent = highscore;

const map = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1]
];

const cellSize = 40;

function createDots() {
  dots = [];
  powerUps = [];
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      if (map[i][j] === 0) {
        if ((i === 1 && j === 1) || (i === 1 && j === 8) || (i === 8 && j === 1) || (i === 8 && j === 8)) {
          powerUps.push({ x: j * cellSize + cellSize/2, y: i * cellSize + cellSize/2 });
        } else {
          dots.push({ x: j * cellSize + cellSize/2, y: i * cellSize + cellSize/2 });
        }
      }
    }
  }
}

function createGhosts(num) {
  ghosts = [];
  for (let i = 0; i < num; i++) {
    ghosts.push({
      x: 60 + i*60,
      y: 60,
      color: ["red", "pink", "cyan", "orange"][i % 4],
      dx: Math.random() < 0.5 ? 1 : -1,
      dy: Math.random() < 0.5 ? 1 : -1,
      speed: 1 + level * 0.5
    });
  }
}

function drawMap() {
  ctx.fillStyle = "blue";
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      if (map[i][j] === 1) {
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }
}

function drawPac() {
  ctx.beginPath();
  ctx.arc(pac.x, pac.y, pac.size, 0.2 * Math.PI, 1.8 * Math.PI);
  ctx.lineTo(pac.x, pac.y);
  ctx.fillStyle = "yellow";
  ctx.fill();
}

function drawGhost(g) {
  ctx.fillStyle = frightened ? "blue" : g.color;
  ctx.fillRect(g.x - 15, g.y - 15, 30, 30);
}

function drawDots() {
  ctx.fillStyle = "white";
  dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPowerUps() {
  ctx.fillStyle = "orange";
  powerUps.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function collidesWithWall(x, y) {
  let col = Math.floor(x / cellSize);
  let row = Math.floor(y / cellSize);
  return map[row] && map[row][col] === 1;
}

function applyPortals(entity) {
  if (entity.x < 0) entity.x = canvas.width;
  if (entity.x > canvas.width) entity.x = 0;
  if (entity.y < 0) entity.y = canvas.height;
  if (entity.y > canvas.height) entity.y = 0;
}

function updatePac() {
  let newX = pac.x + pac.dx;
  let newY = pac.y + pac.dy;

  if (!collidesWithWall(newX, newY)) {
    pac.x = newX;
    pac.y = newY;
  }

  applyPortals(pac);

  dots = dots.filter(d => {
    let dist = Math.hypot(pac.x - d.x, pac.y - d.y);
    if (dist < pac.size) {
      score++;
      eatSound.play();
      scoreEl.textContent = score;
      if (score > highscore) {
        highscore = score;
        highscoreEl.textContent = highscore;
        localStorage.setItem("pacmanHighscore", highscore);
      }
      return false;
    }
    return true;
  });

  powerUps = powerUps.filter(p => {
    let dist = Math.hypot(pac.x - p.x, pac.y - p.y);
    if (dist < pac.size) {
      frightened = true;
      frightenedTimer = 300; // ~5 segundos
      return false;
    }
    return true;
  });

  if (dots.length === 0 && powerUps.length === 0) {
    level++;
    levelEl.textContent = level;
    createDots();
    createGhosts(level + 1);
  }
}

function updateGhosts() {
  ghosts.forEach(g => {
    let newX = g.x + g.dx * g.speed;
    let newY = g.y + g.dy * g.speed;

    if (!collidesWithWall(newX, newY)) {
      g.x = newX;
      g.y = newY;
    } else {
      g.dx *= -1;
      g.dy *= -1;
    }

    applyPortals(g);

    if (Math.random() < 0.02) {
      g.dx = pac.x > g.x ? 1 : pac.x < g.x ? -1 : 0;
      g.dy = pac.y > g.y ? 1 : pac.y < g.y ? -1 : 0;
    }

    let dist = Math.hypot(pac.x - g.x, pac.y - g.y);
    if (dist < pac.size + 15) {
      if (frightened) {
        score += 10; // bônus por comer fantasma
        scoreEl.textContent = score;
        g.x = 200; g.y = 200; // fantasma volta ao centro
      } else {
        lives--;
        livesEl.textContent = lives;
        pac.x = 200; pac.y = 200; pac.dx = 0; pac.dy = 0;
        if (lives <= 0) {
          alert("Game Over! Pontos: " + score);
          document.location.reload();
        }
      }
    }
  });

  if (frightened) {
    frightenedTimer--;
    if (frightenedTimer <= 0) {
      frightened = false;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, 400, 400);
  drawMap();
  drawPac();
  ghosts.forEach(drawGhost);
  drawDots();
  drawPowerUps();
}

function loop() {
  updatePac();
  updateGhosts();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") { pac.dx = 0; pac.dy = -2; }
  if (e.key === "ArrowDown") { pac.dx = 0; pac.dy = 2; }
  if (e.key === "ArrowLeft") { pac.dx = -2; pac.dy = 0; }
  if (e.key === "ArrowRight") { pac.dx = 2; pac.dy = 0; }
});

createDots();
createGhosts(level + 1);
loop();
