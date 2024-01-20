'use strict';

export class CommandRing {
  private CMD_RING_SIZE = 1000;
  private commands: string[];
  private size: number;
  private currentPosition: number;

  constructor() {
    this.size = 0;
    this.commands = new Array<string>(this.CMD_RING_SIZE);
    this.currentPosition = 0;
  }

  pushCommand(cmd: string): void {
    this.commands[this.size] = cmd;
    this.currentPosition = (this.size + 1) % this.CMD_RING_SIZE;
    this.size++;
  }

  getPreviousCommand(): string {
    if (this.currentPosition > 0) {
      this.currentPosition--;
    }
    return this.commands[this.currentPosition];
  }

  getNextCommand(): string {
    if (this.currentPosition < this.size) {
      this.currentPosition++;
    }
    return this.commands[this.currentPosition];
  }
}
