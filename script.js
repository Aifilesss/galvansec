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
        { type: 'info', text: 'Last login: ' + new Date().toUTCString() + ' on ttys001' },
        { type: 'cmd', prompt: 'galvan@sec', cmd: ':~$ cat philosophy.txt' },
        { type: 'quote', text: '"Security is a governance challenge disguised as a technical one."' },
        { type: 'cmd', prompt: 'galvan@sec', cmd: ':~$ _' }
    ];

    let lineIndex = 0;
    let charIndex = 0;
    let currentLine = null;
    let phase = 'prompt';

    function renderBoot() {
        if (lineIndex >= lines.length) {
            bootEl.innerHTML = Array.from(bootEl.querySelectorAll('.boot-line')).map(el => el.outerHTML).join('') + '<span class="boot-cursor"></span>';
            return;
        }

        const line = lines[lineIndex];

        if (line.type === 'info') {
            currentLine = document.createElement('span');
            currentLine.className = 'boot-line boot-info';
            bootEl.appendChild(currentLine);
            const text = line.text;
            if (charIndex < text.length) {
                currentLine.textContent = text.slice(0, charIndex + 1);
                charIndex++;
                setTimeout(renderBoot, 18 + Math.random() * 22);
            } else {
                currentLine.textContent = text;
                lineIndex++;
                charIndex = 0;
                setTimeout(renderBoot, 60);
            }
            return;
        }

        if (line.type === 'quote') {
            currentLine = document.createElement('span');
            currentLine.className = 'boot-line boot-quote-line';
            bootEl.appendChild(currentLine);
            const text = line.text;
            if (charIndex < text.length) {
                currentLine.innerHTML = `<span class="boot-quote">${escapeHtml(text.slice(0, charIndex + 1))}</span>`;
                charIndex++;
                setTimeout(renderBoot, 25 + Math.random() * 35);
            } else {
                currentLine.innerHTML = `<span class="boot-quote">${escapeHtml(text)}</span>`;
                lineIndex++;
                charIndex = 0;
                setTimeout(renderBoot, 160);
            }
            return;
        }

        if (line.type === 'cmd') {
            if (!currentLine) {
                currentLine = document.createElement('span');
                currentLine.className = 'boot-line boot-cmd-line';
                bootEl.appendChild(currentLine);
            }

            if (phase === 'prompt') {
                const promptText = line.prompt;
                if (charIndex < promptText.length) {
                    currentLine.innerHTML += `<span class="boot-prompt">${escapeHtml(promptText.slice(0, charIndex + 1))}</span>`;
                    charIndex++;
                    setTimeout(renderBoot, 30 + Math.random() * 40);
                } else {
                    currentLine.innerHTML += `<span class="boot-prompt">${escapeHtml(promptText)}</span>`;
                    phase = 'at';
                    charIndex = 0;
                    setTimeout(renderBoot, 50);
                }
            } else if (phase === 'at') {
                currentLine.innerHTML += '<span class="boot-at">@</span>';
                phase = 'host';
                setTimeout(renderBoot, 35);
            } else if (phase === 'host') {
                const hostText = 'sec';
                if (charIndex < hostText.length) {
                    currentLine.innerHTML += `<span class="boot-host">${escapeHtml(hostText.slice(0, charIndex + 1))}</span>`;
                    charIndex++;
                    setTimeout(renderBoot, 30 + Math.random() * 35);
                } else {
                    currentLine.innerHTML += `<span class="boot-host">${escapeHtml(hostText)}</span>`;
                    phase = 'colon';
                    charIndex = 0;
                    setTimeout(renderBoot, 40);
                }
            } else if (phase === 'colon') {
                currentLine.innerHTML += '<span class="boot-colon">:</span>';
                phase = 'tilde';
                setTimeout(renderBoot, 35);
            } else if (phase === 'tilde') {
                currentLine.innerHTML += '<span class="boot-tilde">~</span>';
                phase = 'dollar';
                charIndex = 0;
                setTimeout(renderBoot, 40);
            } else if (phase === 'dollar') {
                currentLine.innerHTML += '<span class="boot-dollar">$ </span>';
                phase = 'space';
                setTimeout(renderBoot, 50);
            } else if (phase === 'space') {
                currentLine.innerHTML += ' ';
                phase = 'cmdtext';
                charIndex = 0;
                setTimeout(renderBoot, 60);
            } else if (phase === 'cmdtext') {
                const cmdText = line.cmd.replace(/^:~\$\s*/, '');
                if (charIndex < cmdText.length) {
                    currentLine.innerHTML += `<span class="boot-cmd">${escapeHtml(cmdText.slice(0, charIndex + 1))}</span>`;
                    charIndex++;
                    setTimeout(renderBoot, 22 + Math.random() * 28);
                } else {
                    currentLine.innerHTML += `<span class="boot-cmd">${escapeHtml(cmdText)}</span>`;
                    phase = 'next';
                    lineIndex++;
                    currentLine = null;
                    charIndex = 0;
                    phase = 'prompt';
                    setTimeout(renderBoot, 140);
                }
            }
            return;
        }

        lineIndex++;
        setTimeout(renderBoot, 40);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setTimeout(renderBoot, 200);
}

// Typed badge
const phrases = [
    'Open to opportunities',
    'Cybersecurity & GRC',
    'Palm Beach State College',
    'ISSA – South Florida',
];

const typedEl = document.getElementById('typed-text');
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
