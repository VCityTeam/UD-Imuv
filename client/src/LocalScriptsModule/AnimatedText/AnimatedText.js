import './AnimatedText.css';

export class AnimatedText {
  constructor(params) {
    this.duration = params.duration || 2000;
    this.speed = params.speed || 0.1;

    this.interval = null;
    this.dt = params.dt || 1000 / 30;

    this.xStart = 0;
    this.yStart = 0;

    this.html = document.createElement('div');
    this.html.innerHTML = params.text || 'Default text';
    this.html.style.fontSize = params.fontSize || 'large';
    this.html.style.color = params.color || 'red';
    this.html.classList.add('text_AnimatedText');
  }

  spawn(xScreen, yScreen) {
    this.xStart = xScreen;
    this.yStart = yScreen;

    this.currentTime = 0;

    document.body.appendChild(this.html);
    this.setTextPosition(this.xStart, this.yStart);

    this.interval = setInterval(this.step.bind(this), this.dt);
  }

  setTextPosition(x, y) {
    this.html.style.top = y + 'px';
    this.html.style.left = x + 'px';
  }

  setOpacity(value) {
    this.html.style.opacity = value;
  }

  step() {
    this.currentTime += this.dt;

    this.setTextPosition(
      this.xStart,
      this.yStart - this.speed * this.currentTime
    );

    this.setOpacity(1 - Math.pow(this.currentTime / this.duration, 2));

    if (this.currentTime >= this.duration) this.dispose();
  }

  dispose() {
    clearInterval(this.interval);
    this.html.remove();
  }
}
