const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("start-btn");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const scoreEl = document.getElementById("score");

let score = 0;
let units = [];
let enemyUnits = [];
let bullets = [];
let gameInterval;
let questionInterval;

const questions = [
  {q:"5 + 3?", a:["5","8","10","7"], correct:"8"},
  {q:"Capital of France?", a:["London","Berlin","Paris","Rome"], correct:"Paris"},
  {q:"Red Planet?", a:["Mars","Venus","Jupiter","Saturn"], correct:"Mars"},
  {q:"Mix red + white?", a:["Pink","Purple","Orange","Brown"], correct:"Pink"},
  {q:"10 - 4?", a:["5","6","7","8"], correct:"6"}
];

// Towers
class Tower {
  constructor(x, y, hp, color) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = hp;
    this.color = color;
    this.width = 40;
    this.height = 60;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y - this.height/2, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.fillRect(this.x, this.y - this.height/2 - 10, this.width, 5);
    ctx.fillStyle = "lime";
    ctx.fillRect(this.x, this.y - this.height/2 - 10, this.width * (this.hp/this.maxHp), 5);
  }
}

let playerTowers = [
  new Tower(50, 100, 10, "green"),
  new Tower(50, 200, 10, "green"),
  new Tower(50, 300, 10, "green")
];

let enemyTowers = [
  new Tower(710, 100, 10, "red"),
  new Tower(710, 200, 10, "red"),
  new Tower(710, 300, 10, "red")
];

// Bullets
class Bullet {
  constructor(x, y, speed, target) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.target = target;
  }
  move() {
    if(!this.target || this.target.hp <= 0) return;
    this.x += this.speed;
    if(Math.abs(this.x - this.target.x) < 5) {
      this.target.hp--;
      bullets.splice(bullets.indexOf(this),1);
    }
  }
  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, 5, 5);
  }
}

// Units
class Unit {
  constructor(x, y, speed, color, isRanged=false, targetTower=null, isEnemy=false) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.isRanged = isRanged;
    this.targetTower = targetTower;
    this.hp = 1;
    this.fireCooldown = 0;
    this.isEnemy = isEnemy;
  }
  move() {
    if(this.isRanged) {
      if(!this.isEnemy) {
        let stopX = this.targetTower.x - 80;
        if(this.x + 20 < stopX) this.x += this.speed;
        else if(this.targetTower && this.targetTower.hp > 0) {
          if(this.fireCooldown <= 0) {
            bullets.push(new Bullet(this.x + 20, this.y + 8, 4, this.targetTower));
            this.fireCooldown = 60;
          } else this.fireCooldown--;
        }
      } else {
        let stopX = this.targetTower.x + 80;
        if(this.x - 20 > stopX) this.x -= this.speed;
        else if(this.targetTower && this.targetTower.hp > 0) {
          if(this.fireCooldown <= 0) {
            bullets.push(new Bullet(this.x - 5, this.y + 8, -4, this.targetTower));
            this.fireCooldown = 60;
          } else this.fireCooldown--;
        }
      }
    } else {
      this.x += this.isEnemy ? -this.speed : this.speed;
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 20, 20);
  }
}

// Spawn player unit
function spawnPlayerUnit() {
  if(enemyTowers.length === 0) return;
  let targetTower = enemyTowers[Math.floor(Math.random()*enemyTowers.length)];
  let isRanged = Math.random() < 0.5;
  units.push(new Unit(50, targetTower.y, 2, "green", isRanged, targetTower, false));
}

// Spawn enemy unit
function spawnEnemyUnit() {
  if(playerTowers.length === 0) return;
  let targetTower = playerTowers[Math.floor(Math.random()*playerTowers.length)];
  let isRanged = Math.random() < 0.5;
  enemyUnits.push(new Unit(730, targetTower.y, 1.5, "red", isRanged, targetTower, true));
}

// Question
function spawnQuestion() {
  const q = questions[Math.floor(Math.random()*questions.length)];
  questionEl.textContent = q.q;
  answersEl.innerHTML = "";
  q.a.forEach(ans => {
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.onclick = () => {
      if(ans === q.correct) { 
        spawnPlayerUnit(); 
        score++; 
        scoreEl.textContent = score;
      }
      spawnQuestion(); // new question immediately
    };
    answersEl.appendChild(btn);
  });
}

// Check unit collisions
function checkUnitCollisions() {
  units.forEach((u, i) => {
    enemyUnits.forEach((e, j) => {
      if(Math.abs(u.x - e.x) < 20 && Math.abs(u.y - e.y) < 20) {
        units.splice(i, 1);
        enemyUnits.splice(j, 1);
      }
    });
  });
}

// Start game
function startGame() {
  startBtn.style.display = "none";
  score = 0;
  scoreEl.textContent = score;
  units = [];
  enemyUnits = [];
  bullets = [];
  
  spawnQuestion();
  questionInterval = setInterval(spawnQuestion, 5000);
  
  gameInterval = requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop() {
  ctx.clearRect(0,0,canvas.width, canvas.height);

  // Draw towers
  playerTowers.forEach(t => t.draw());
  enemyTowers.forEach(t => t.draw());

  // Move and draw units
  units.forEach(u => { u.move(); u.draw(); });
  enemyUnits.forEach(u => { u.move(); u.draw(); });

  // Move and draw bullets
  bullets.forEach(b => { b.move(); b.draw(); });

  // Check soldier collisions
  checkUnitCollisions();

  // Remove dead towers
  playerTowers = playerTowers.filter(t => t.hp > 0);
  enemyTowers = enemyTowers.filter(t => t.hp > 0);

  // Enemy AI spawn
  if(Math.random() < 0.01) spawnEnemyUnit();

  // Check game over
  if(playerTowers.length === 0 || enemyTowers.length === 0) {
    cancelAnimationFrame(gameInterval);
    clearInterval(questionInterval);
    questionEl.textContent = playerTowers.length === 0 ? "You Lose!" : "You Win!";
    answersEl.innerHTML="";
    startBtn.style.display = "block";
    return;
  }

  gameInterval = requestAnimationFrame(gameLoop);
}

startBtn.onclick = startGame;
