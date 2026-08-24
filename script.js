// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Terminal philosophy animation
const command = "cat philosophy.txt";
const philosophy = "Security is a governance challenge disguised as a technical one.";

const cmdEl = document.getElementById("cmdText");
const outputEl = document.getElementById("output");
const cursorEl = document.getElementById("cursor");
const terminalEl = document.getElementById("terminal");

let running = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function playAnimation() {
    if (running) return;
    running = true;

    cmdEl.textContent = "";
    outputEl.textContent = "";
    cursorEl.style.display = "inline-block";

    // Type the command
    for (let i = 0; i < command.length; i++) {
        cmdEl.textContent += command[i];
        await sleep(35 + Math.random() * 40);
    }

    await sleep(400);
    cursorEl.style.display = "none";

    // Type the philosophy output
    for (let i = 0; i < philosophy.length; i++) {
        outputEl.textContent += philosophy[i];
        await sleep(28 + Math.random() * 35);
    }

    running = false;
}

if (terminalEl) {
    terminalEl.addEventListener("click", playAnimation);
    window.addEventListener("load", () => setTimeout(playAnimation, 400));
}

// Matrix rain
const canvas = document.getElementById('matrix');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let cols = 0;
    let drops = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const fontSize = 12;
        cols = Math.floor(canvas.width / fontSize);
        drops = Array.from({ length: cols }, () => Math.random() * -100);
    }

    function draw() {
        ctx.fillStyle = 'rgba(10, 15, 26, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#3b82f6';
        ctx.font = '12px JetBrains Mono';

        for (let i = 0; i < drops.length; i++) {
            const text = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillText(text, i * 12, drops[i] * 12);
            if (drops[i] * 12 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    resize();
    window.addEventListener('resize', resize);
    setInterval(draw, 50);
}
