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

// Boot sequence
const bootEl = document.getElementById('boot-sequence');
if (bootEl) {
    const lines = [
        { prompt: 'galvan@sec', cmd: ':~$ cat philosophy.txt', quote: true, text: '"Security is a governance challenge disguised as a technical one."' }
    ];

    let lineIndex = 0;
    let charIndex = 0;
    let currentLine = null;
    let phase = 'prompt'; // prompt -> space -> cmd -> quote -> next

    function renderBoot() {
        if (lineIndex >= lines.length) {
            bootEl.innerHTML = Array.from(bootEl.querySelectorAll('.boot-line')).map(el => el.outerHTML).join('') + '<span class="boot-cursor"></span>';
            return;
        }

        const line = lines[lineIndex];
        if (!currentLine) {
            currentLine = document.createElement('span');
            currentLine.className = 'boot-line';
            bootEl.appendChild(currentLine);
        }

        if (phase === 'prompt') {
            const promptText = line.prompt;
            if (charIndex < promptText.length) {
                currentLine.innerHTML += `<span class="boot-prompt">${promptText.slice(0, charIndex + 1)}</span>`;
                charIndex++;
                setTimeout(renderBoot, 40 + Math.random() * 50);
            } else {
                currentLine.innerHTML += `<span class="boot-prompt">${promptText}</span>`;
                phase = 'space';
                charIndex = 0;
                setTimeout(renderBoot, 120);
            }
        } else if (phase === 'space') {
            currentLine.innerHTML += ' ';
            phase = 'cmd';
            setTimeout(renderBoot, 80);
        } else if (phase === 'cmd') {
            const cmdText = line.cmd;
            if (charIndex < cmdText.length) {
                currentLine.innerHTML += `<span class="boot-cmd">${cmdText.slice(0, charIndex + 1)}</span>`;
                charIndex++;
                setTimeout(renderBoot, 30 + Math.random() * 40);
            } else {
                currentLine.innerHTML += `<span class="boot-cmd">${cmdText}</span>`;
                if (line.quote && line.text) {
                    phase = 'quote';
                    currentLine = null;
                    charIndex = 0;
                    setTimeout(renderBoot, 200);
                } else {
                    phase = 'next';
                    lineIndex++;
                    currentLine = null;
                    charIndex = 0;
                    phase = 'prompt';
                    setTimeout(renderBoot, 350);
                }
            }
        } else if (phase === 'quote') {
            currentLine = document.createElement('span');
            currentLine.className = 'boot-line';
            bootEl.appendChild(currentLine);
            const quoteText = line.text;
            if (charIndex < quoteText.length) {
                currentLine.innerHTML += `<span class="boot-quote">${quoteText.slice(0, charIndex + 1)}</span>`;
                charIndex++;
                setTimeout(renderBoot, 35 + Math.random() * 45);
            } else {
                currentLine.innerHTML += `<span class="boot-quote">${quoteText}</span>`;
                phase = 'next';
                lineIndex++;
                currentLine = null;
                charIndex = 0;
                phase = 'prompt';
                setTimeout(renderBoot, 350);
            }
        }
    }

    setTimeout(renderBoot, 400);
}

// Typed badge
const phrases = [
    'Open to opportunities',
    'Cybersecurity & GRC',
    'Palm Beach State College',
    'ISSA – South Florida',
];

const typedEl = document.getElementById('typed-text');
const cursorEl = document.querySelector('.cursor');
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
    const current = phrases[phraseIndex];
    if (!typedEl) return;

    if (!isDeleting) {
        typedEl.textContent = current.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
            setTimeout(() => { isDeleting = true; type(); }, 1800);
            return;
        }
    } else {
        typedEl.textContent = current.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
        }
    }

    setTimeout(type, isDeleting ? 45 : 80);
}

setTimeout(type, 600);

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
