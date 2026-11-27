// Gobble Run — keyboard, mouse and touch input, turned into a small queue
// of discrete events the game loop drains once per frame.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.queue = [];
    this.muted = false;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  push(event) {
    this.queue.push(event);
  }

  drain() {
    const events = this.queue;
    this.queue = [];
    return events;
  }

  onKeyDown(event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.push('up');
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.push('down');
        event.preventDefault();
        break;
      case 'Space':
        this.push('jump');
        event.preventDefault();
        break;
      case 'Enter':
        this.push('start');
        event.preventDefault();
        break;
      case 'KeyP':
        this.push('pause');
        break;
      case 'KeyM':
        this.push('mute');
        break;
      default:
        break;
    }
  }

  onPointerDown(event) {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    // Exactly one action per tap: high switches lane up, low switches lane
    // down, middle jumps. On menus any of these starts the run.
    if (y < 0.33) this.push('up');
    else if (y > 0.66) this.push('down');
    else this.push('jump');
  }
}
