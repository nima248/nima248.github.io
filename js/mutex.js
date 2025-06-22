export class Mutex {
  constructor() {
    this._locked = false;
    this._waiters = [];
  }

  async lock() {
    if (!this._locked) {
      this._locked = true;
      return;
    }

    return new Promise((resolve) => {
      this._waiters.push(resolve);
    });
  }

  unlock() {
    if (this._waiters.length > 0) {
      const next = this._waiters.shift();
      next(); // let next in line proceed
    } else {
      this._locked = false;
    }
  }
}
