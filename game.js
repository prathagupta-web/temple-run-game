// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game states
const GAME_STATE = {
    RUNNING: 'running',
    GAME_OVER: 'gameOver'
};

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 120,
    width: 30,
    height: 50,
    velocityY: 0,
    velocityX: 0,
    jumping: false,
    sliding: false,
    slidingTimer: 0,
    lane: 1, // 0 = left, 1 = center, 2 = right
    laneWidth: canvas.width / 3,
    isAlive: true
};

// Game variables
let gameState = GAME_STATE.RUNNING;
let score = 0;
let gameSpeed = 5;
let spawnRate = 0.02;
let obstacles = [];
let coins = [];
let gravity = 0.6;
let jumpPower = -15;

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'ArrowUp' && !player.jumping && !player.sliding) {
        player.velocityY = jumpPower;
        player.jumping = true;
    }

    if (e.key === 'ArrowDown' && !player.jumping && !player.sliding) {
        player.sliding = true;
        player.slidingTimer = 30;
        player.height = 25;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Obstacle class
class Obstacle {
    constructor(type = 'wall') {
        this.x = canvas.width;
        this.y = canvas.height - 60;
        this.width = 60;
        this.height = 60;
        this.type = type; // 'wall' or 'spike'
        this.lane = Math.floor(Math.random() * 3);
        this.x = this.lane * player.laneWidth + (player.laneWidth - this.width) / 2;
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        if (this.type === 'wall') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Add texture
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    ctx.fillStyle = '#A0522D';
                    ctx.fillRect(this.x + i * 20, this.y + j * 20, 18, 18);
                }
            }
        } else if (this.type === 'spike') {
            ctx.fillStyle = '#DC143C';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// Coin class
class Coin {
    constructor() {
        this.x = canvas.width;
        this.y = canvas.height - 120;
        this.radius = 10;
        this.lane = Math.floor(Math.random() * 3);
        this.x = this.lane * player.laneWidth + player.laneWidth / 2;
        this.collected = false;
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    isOffScreen() {
        return this.x + this.radius < 0;
    }
}

// Update player
function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft'] && player.lane > 0) {
        player.lane--;
        keys['ArrowLeft'] = false;
    }
    if (keys['ArrowRight'] && player.lane < 2) {
        player.lane++;
        keys['ArrowRight'] = false;
    }

    player.x = player.lane * player.laneWidth + (player.laneWidth - player.width) / 2;

    // Vertical movement (jumping)
    if (player.jumping) {
        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y >= canvas.height - 120) {
            player.y = canvas.height - 120;
            player.jumping = false;
            player.velocityY = 0;
        }
    }

    // Sliding
    if (player.sliding) {
        player.slidingTimer--;
        if (player.slidingTimer <= 0) {
            player.sliding = false;
            player.height = 50;
        }
    }
}

// Spawn obstacles and coins
function spawn() {
    if (Math.random() < spawnRate) {
        const type = Math.random() < 0.7 ? 'wall' : 'spike';
        obstacles.push(new Obstacle(type));
    }

    if (Math.random() < spawnRate * 0.5) {
        coins.push(new Coin());
    }
}

// Check collisions
function checkCollisions() {
    for (let obstacle of obstacles) {
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            if (!player.sliding) {
                gameState = GAME_STATE.GAME_OVER;
                player.isAlive = false;
            }
        }
    }

    for (let coin of coins) {
        if (
            !coin.collected &&
            player.x < coin.x + coin.radius &&
            player.x + player.width > coin.x - coin.radius &&
            player.y < coin.y + coin.radius &&
            player.y + player.height > coin.y - coin.radius
        ) {
            coin.collected = true;
            score += 10;
        }
    }
}

// Update game
function update() {
    if (gameState !== GAME_STATE.RUNNING) return;

    updatePlayer();
    spawn();

    obstacles.forEach(obstacle => obstacle.update());
    coins.forEach(coin => coin.update());

    obstacles = obstacles.filter(o => !o.isOffScreen());
    coins = coins.filter(c => !c.isOffScreen() || !c.collected);

    checkCollisions();

    // Increase difficulty
    gameSpeed += 0.001;
    spawnRate += 0.00001;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw road
    ctx.fillStyle = '#8B7355';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(i * player.laneWidth, 0, player.laneWidth, canvas.height);
        if (i < 2) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo((i + 1) * player.laneWidth, 0);
            ctx.lineTo((i + 1) * player.laneWidth, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Draw player
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 5, player.y + 10, 8, 8);
    ctx.fillRect(player.x + 17, player.y + 10, 8, 8);
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 6, player.y + 11, 6, 6);
    ctx.fillRect(player.x + 18, player.y + 11, 6, 6);

    // Draw obstacles
    obstacles.forEach(obstacle => obstacle.draw());

    // Draw coins
    coins.forEach(coin => coin.draw());

    // Draw score
    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;

    // Draw game over screen
    if (gameState === GAME_STATE.GAME_OVER) {
        document.getElementById('finalScore').textContent = Math.floor(score);
        document.getElementById('gameOver').style.display = 'block';
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
