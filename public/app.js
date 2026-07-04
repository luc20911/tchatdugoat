const socket = io();
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const colorInput = document.getElementById('usercolor');
let creationInterval = null;
let mousePos = { x: 0, y: 0 };

// --- Gestion du Chat ---
function appendMessage(data) {
    const item = document.createElement('li');
    item.innerHTML = `<span style="color:${data.color}; font-weight:bold;">${data.user}</span>: ${data.text}`;
    messages.appendChild(item);
    document.getElementById('chat-window').scrollTop = document.getElementById('chat-window').scrollHeight;
}

socket.on('load history', (history) => {
    history.forEach(msg => appendMessage(msg));
});

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        socket.emit('chat message', {
            user: usernameInput.value || 'Viewer',
            color: colorInput.value,
            text: input.value
        });
        input.value = '';
    }
});

socket.on('chat message', appendMessage);

// --- Gestion du Canvas et des balles ---
const canvas = document.getElementById('bouncingBalls');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

let balls = [];
let draggedBall = null;
let lastMouseX = 0;
let lastMouseY = 0;

// Réception des balles
socket.on('new ball', (ball) => {
    balls.push({ ...ball, createdAt: Date.now() });
});

// Synchronisation du mouvement et de la vitesse
socket.on('move ball', (data) => {
    const b = balls.find(ball => ball.id === data.id);
    if (b) {
        b.x = data.x;
        b.y = data.y;
        b.dx = data.dx;
        b.dy = data.dy;
    }
});

canvas.addEventListener('mousedown', (e) => {
    mousePos.x = e.offsetX;
    mousePos.y = e.offsetY;
    draggedBall = balls.find(b => Math.hypot(b.x - e.offsetX, b.y - e.offsetY) < 20);


    creationInterval = setInterval(() => {
        const newBall = {
            id: Date.now() + Math.random(),
            x: mousePos.x,
            y: mousePos.y,
            dx: (Math.random() - 0.5) * 7,
            dy: (Math.random() - 0.5) * 7,
            color: colorInput.value // Utilise la couleur de la palette[cite: 3]
            };
        socket.emit('add ball', newBall);
    }, 15);

});

canvas.addEventListener('mousemove', (e) => {
    mousePos.x = e.offsetX;
    mousePos.y = e.offsetY;
    if (draggedBall) {
        draggedBall.dx = (e.offsetX - lastMouseX) * 0.5;
        draggedBall.dy = (e.offsetY - lastMouseY) * 0.5;
        draggedBall.x = e.offsetX;
        draggedBall.y = e.offsetY;
        lastMouseX = e.offsetX;
        lastMouseY = e.offsetY;
    }
});

canvas.addEventListener('mouseup', () => {
    if (creationInterval) {
        clearInterval(creationInterval);
        creationInterval = null;
    }
    if (draggedBall) {
        socket.emit('update ball', {
            id: draggedBall.id,
            x: draggedBall.x,
            y: draggedBall.y,
            dx: draggedBall.dx,
            dy: draggedBall.dy
        });
        draggedBall = null;
    }
});

// Lancer une balle au clic unique
canvas.addEventListener('click', (e) => {
    if (!draggedBall) {
        const newBall = {
            id: Date.now() + Math.random(),
                        x: e.offsetX,
                        y: e.offsetY,
                        dx: (Math.random() - 0.5) * 10,
                        dy: (Math.random() - 0.5) * 10,
                        color: colorInput.value // Utilise la couleur de la palette[cite: 3]
        };
        socket.emit('add ball', newBall);
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();

    balls = balls.filter(b => {
        const age = now - b.createdAt;
        if (age > 30000) return false;

        const radius = Math.max(0, 15 - (age / 3000));

        if (b !== draggedBall) {
            if (b.x + b.dx > canvas.width || b.x + b.dx < 0) b.dx = -b.dx;
            if (b.y + b.dy > canvas.height || b.y + b.dy < 0) b.dy = -b.dy;
            b.x += b.dx;
            b.y += b.dy;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        return true;
    });
    requestAnimationFrame(animate);
}
animate();
