const boxes = document.querySelectorAll(".box");
const startBtn = document.querySelector("#start-btn");
const resetBtn = document.querySelector("#reset-btn");
const changePlayerBtn = document.querySelector("#change-player-btn");

const playerModal = document.querySelector("#player-modal");
const playerForm = document.querySelector("#player-form");
const confirmStartBtn = document.querySelector("#confirm-start-btn");
const cancelModalBtn = document.querySelector("#cancel-modal-btn");
const playerOInput = document.querySelector("#player-o-name");
const playerXInput = document.querySelector("#player-x-name");

const turnIndicator = document.querySelector("#turn-indicator");
const turnPlayerName = document.querySelector("#turn-player-name");
const turnPlayerSymbol = document.querySelector("#turn-player-symbol");

const msgContainer = document.querySelector(".msg-container");
const msg = document.querySelector("#msg");
const newBtn = document.querySelector("#new-btn");
const newPlayersBtn = document.querySelector("#new-players-btn");

const confettiCanvas = document.querySelector("#confetti-canvas");
const ctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;

let playerOName = "Player O";
let playerXName = "Player X";
let turnO = true; // playerO first
let gameStarted = false;
let gameOver = false;
let moveCount = 0;

const winPatterns = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [1, 4, 7],
    [2, 5, 8],
    [2, 4, 6],
    [3, 4, 5],
    [6, 7, 8],
];

/* ----------------------------------------------------
   Celebration Confetti Blast Engine
---------------------------------------------------- */
let confettiParticles = [];
let confettiAnimationId = null;

const resizeConfetti = () => {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
};
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

const confettiColors = [
    "#ff4d6d", // Red
    "#0077b6", // Blue
    "#ffd166", // Gold
    "#06d6a0", // Emerald Green
    "#ff9f1c", // Warm Amber
    "#ffffff", // Crisp White
    "#f72585", // Neon Magenta
    "#7209b7", // Royal Purple
];

class ConfettiParticle {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * confettiCanvas.width;
        this.y = initial ? Math.random() * confettiCanvas.height * 0.7 - confettiCanvas.height * 0.4 : -20;
        this.size = Math.random() * 10 + 6;
        this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = Math.random() * 3.5 + 2.5;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 8;
        this.wobble = Math.random() * 10;
        this.wobbleSpeed = Math.random() * 0.08 + 0.04;
        this.shape = Math.random() > 0.35 ? "rect" : "circle";
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        this.wobble += this.wobbleSpeed;
        this.speedX += Math.sin(this.wobble) * 0.2;

        if (this.y > confettiCanvas.height + 20) {
            this.reset(false);
        }
    }

    draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;

        if (this.shape === "rect") {
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

const startConfetti = () => {
    stopConfetti();
    resizeConfetti();
    if (!ctx) return;

    confettiParticles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 8), 160);
    for (let i = 0; i < particleCount; i++) {
        confettiParticles.push(new ConfettiParticle());
    }

    const render = () => {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiParticles.forEach(p => {
            p.update();
            p.draw();
        });
        confettiAnimationId = requestAnimationFrame(render);
    };

    render();
};

const stopConfetti = () => {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    if (ctx && confettiCanvas) {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    confettiParticles = [];
};

/* ----------------------------------------------------
   Game Setup & Flow
---------------------------------------------------- */
// Open name entry modal
const openPlayerModal = () => {
    stopConfetti();
    msgContainer.classList.add("hide");
    playerModal.classList.remove("hide");
    playerOInput.focus();
};

// Close name entry modal
const closePlayerModal = () => {
    playerModal.classList.add("hide");
};

// Update Turn display
const updateTurnUI = () => {
    if (turnO) {
        turnPlayerName.innerText = playerOName;
        turnPlayerSymbol.innerText = "O";
        turnPlayerSymbol.className = "symbol-o";
    } else {
        turnPlayerName.innerText = playerXName;
        turnPlayerSymbol.innerText = "X";
        turnPlayerSymbol.className = "symbol-x";
    }
};

// Start or restart game with configured player names
const startGame = (e) => {
    if (e) e.preventDefault();

    const oVal = playerOInput.value.trim();
    const xVal = playerXInput.value.trim();

    playerOName = oVal !== "" ? oVal : "Player O";
    playerXName = xVal !== "" ? xVal : "Player X";

    gameStarted = true;
    closePlayerModal();

    startBtn.classList.add("hide");
    resetBtn.classList.remove("hide");
    changePlayerBtn.classList.remove("hide");
    turnIndicator.classList.remove("hide");

    resetBoard();
};

// Reset board keeping current players
const resetBoard = () => {
    stopConfetti();
    turnO = true;
    moveCount = 0;
    gameOver = false;

    boxes.forEach(box => {
        box.innerText = "";
        box.disabled = false;
        box.classList.remove("winning-box", "box-o", "box-x");
    });

    updateTurnUI();
    msgContainer.classList.add("hide");
};

// Disable all boxes
const disableBoxes = () => {
    boxes.forEach(box => {
        box.disabled = true;
    });
};

// Check for winner or draw
const checkWinner = () => {
    for (let pattern of winPatterns) {
        let pos1Val = boxes[pattern[0]].innerText;
        let pos2Val = boxes[pattern[1]].innerText;
        let pos3Val = boxes[pattern[2]].innerText;

        if (pos1Val !== "" && pos2Val !== "" && pos3Val !== "") {
            if (pos1Val === pos2Val && pos2Val === pos3Val) {
                // Highlight winning boxes with celebratory pulse
                pattern.forEach(index => boxes[index].classList.add("winning-box"));
                
                const winnerName = pos1Val === "O" ? playerOName : playerXName;
                showWinner(winnerName);
                return true;
            }
        }
    }

    if (moveCount === 9) {
        showDraw();
        return true;
    }

    return false;
};

// Show winner with player name and celebration confetti blast
const showWinner = (winner) => {
    gameOver = true;
    disableBoxes();
    startConfetti();

    setTimeout(() => {
        msg.innerText = `Congratulations, Winner is ${winner}!`;
        msgContainer.classList.remove("hide");
    }, 400);
};

// Show draw announcement
const showDraw = () => {
    gameOver = true;
    disableBoxes();

    setTimeout(() => {
        msg.innerText = "Match Drawn, Well Played Both!";
        msgContainer.classList.remove("hide");
    }, 400);
};

// Box click handler
boxes.forEach((box) => {
    box.addEventListener("click", () => {
        if (gameOver || box.innerText !== "") return;

        // If player clicks box before clicking start, prompt them to start
        if (!gameStarted) {
            openPlayerModal();
            return;
        }

        if (turnO) {
            box.innerText = "O";
            box.classList.add("box-o");
            turnO = false;
        } else {
            box.innerText = "X";
            box.classList.add("box-x");
            turnO = true;
        }

        box.disabled = true;
        moveCount++;

        const hasEnded = checkWinner();
        if (!hasEnded) {
            updateTurnUI();
        }
    });
});

// Event Listeners
startBtn.addEventListener("click", openPlayerModal);
confirmStartBtn.addEventListener("click", startGame);
playerForm.addEventListener("submit", startGame);
cancelModalBtn.addEventListener("click", closePlayerModal);

resetBtn.addEventListener("click", resetBoard);
changePlayerBtn.addEventListener("click", openPlayerModal);
newBtn.addEventListener("click", resetBoard);
newPlayersBtn.addEventListener("click", openPlayerModal);