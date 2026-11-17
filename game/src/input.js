// Keyboard + mouse state. The game polls `keys` each frame and consumes
// one-shot actions (dash / confirm / pause) through flags set by events.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false };
    this.dashPressed = false;
    this.confirmPressed = false;
    this.pausePressed = false;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key.toLowerCase());
      if (e.key === ' ') this.dashPressed = true;
      if (e.key === 'Enter') this.confirmPressed = true;
      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') this.pausePressed = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    const toGame = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    };
    canvas.addEventListener('mousemove', toGame);
    canvas.addEventListener('mousedown', (e) => {
      toGame(e);
      this.mouse.down = true;
      this.dashPressed = true;
      this.confirmPressed = true;
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  }

  moveVector() {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  consume(name) {
    const v = this[name];
    this[name] = false;
    return v;
  }
}
