'use strict';

import {
  Event,
  EventEmitter,
  Pseudoterminal,
  TerminalDimensions,
  window,
} from 'vscode';
import { CiaoTopLevelKind } from '../../../shared/types';
import {
  KEYS,
  COLORS,
  PROMPTS,
  ESCAPE_SEQ,
  debuggerDecorationAtom,
  debuggerDecorationType,
} from '../constants';
import { CommandRing } from './ciaoCommandRing';
import { CProc } from './cproc';
import { markDbgMarksOnCiaoSource } from './ciaoFile';
import { parseDbgMsg } from './ciaoDbg';

export class CiaoPTY implements Pseudoterminal {
  onDidWrite: Event<string>;
  private writeEmitter: EventEmitter<string>;
  private line: string;
  private previousLines: string[];
  private prompt: string;
  private promptLength: number;
  private cursor: number;
  private isQueryMode: boolean;
  private cproc: CProc;
  private commandRing: CommandRing;
  private dimensions: TerminalDimensions | undefined;

  constructor(kind: CiaoTopLevelKind) {
    this.writeEmitter = new EventEmitter<string>();
    this.onDidWrite = this.writeEmitter.event;
    this.line = '';
    this.previousLines = [];
    this.prompt = PROMPTS[kind].text;
    this.promptLength = PROMPTS[kind].length;
    this.cursor = 0;
    this.isQueryMode = true;
    this.commandRing = new CommandRing();
    this.cproc = new CProc(kind, (output: string) => {
      this.isQueryMode = output.endsWith(this.prompt);
      this.#displayOutput(this.#formatOutput(output));
    });
  }

  async open(dimensions?: TerminalDimensions): Promise<CiaoPTY> {
    this.dimensions = dimensions;
    // Start the ciaosh process
    await this.cproc.start();
    return this;
  }

  close(): void {
    // When the user closes the terminal the cproc is terminated
    this.cproc.exit();
  }

  handleInput(data: string): void {
    const handleArrowLeft = (): void => {
      if (this.cursor > 0) {
        this.cursor--;
        this.#displayOutput(data);
      }
    };

    const handleArrowRight = (): void => {
      if (this.cursor < this.line.length) {
        this.cursor++;
        this.#displayOutput(data);
      }
    };

    const handleArrowUp = (): void => {
      if (!this.isQueryMode) return;
      const prevCmd: string = this.commandRing.getPreviousCommand();
      if (!prevCmd) return;
      this.#deletePrevCmd();
      this.line = prevCmd;
      this.cursor = this.line.length;
      this.#displayOutput(`\r${this.#colorPrompt()}${this.line}`);
    };

    const handleArrowDown = (): void => {
      if (!this.isQueryMode) return;

      const nextCmd: string = this.commandRing.getNextCommand();
      this.#deletePrevCmd();

      if (nextCmd) {
        this.line = nextCmd;
        this.cursor = this.line.length;
        this.#displayOutput(`\r${this.#colorPrompt()}${this.line}`);
      } else {
        this.line = '';
        this.cursor = 0;
        this.#displayOutput(`\r${this.#colorPrompt()}`);
      }
    };

    const handleBackspace = (): void => {
      // TODO: Fix deleting characters in the middle of a very big query
      // For a very big one line query that cannot fit in one line
      if (
        this.dimensions &&
        (this.cursor + this.promptLength) % this.dimensions.columns === 0
      ) {
        // Move cursor to the previous line
        this.#displayOutput(ESCAPE_SEQ.PREVIOUS_LINE);
        // Move cursor to the end of the line
        this.#displayOutput(`\x1b[${this.dimensions.columns}C`);
        this.line =
          this.line.slice(0, this.cursor - 1) +
          this.line.slice(this.cursor, this.line.length);
        this.cursor--;
        this.#displayOutput(ESCAPE_SEQ.DELETE_CHAR);
        return;
      }

      // For a multiple line query
      if (this.previousLines.length !== 0 && this.cursor === 0) {
        // Pop will always return string as the array is not empty
        this.line = this.previousLines.pop() as string;
        this.cursor = this.line.length;
        // Move cursor to the previous line
        this.#displayOutput(ESCAPE_SEQ.PREVIOUS_LINE);
        // Move cursor to the end of the line
        this.#displayOutput(`\x1b[${this.cursor + this.promptLength}C`);
        return;
      }

      // Empty query
      if (this.cursor === 0) {
        return;
      }

      // Default case
      this.line =
        this.line.slice(0, this.cursor - 1) +
        this.line.slice(this.cursor, this.line.length);

      this.#displayOutput(KEYS.ARROW_LEFT);
      this.cursor--;
      this.#displayOutput(ESCAPE_SEQ.DELETE_CHAR);
    };

    const handleCtrlA = (): void => {
      if (!this.isQueryMode) return;
      // Move the cursor to the beginning of the query
      this.#displayOutput(`\x1b[${this.cursor}D`);
      this.cursor = 0;
    };

    const handleCtrlDC = (): void => {
      this.isQueryMode && this.#finishTopLevel();
    };

    const handleCtrlE = (): void => {
      if (!this.isQueryMode) return;

      // Move the cursor to the end of the query
      this.#displayOutput(`\x1b[${this.line.length - this.cursor}C`);
      this.cursor = this.line.length;
    };

    const handleCtrlK = (): void => {
      if (!this.isQueryMode) return;
      // Delete all characters from the end of the line until the cursor
      this.line = this.line.slice(0, this.cursor);
      this.#deletePrevCmd();

      this.previousLines.length !== 0
        ? // Line from a multiple line query
          this.#displayOutput(`\r${'   '}${this.line}`)
        : // Line from a single line query
          this.#displayOutput(`\r${this.#colorPrompt()}${this.line}`);
    };

    const handleCtrlL = (): void => {
      if (!this.isQueryMode) return;
      // Clear the screen
      this.#displayOutput(ESCAPE_SEQ.CLEAR_SCREEN);
      // Move the cursor to the very top
      this.#displayOutput(ESCAPE_SEQ.FIRST_LINE);
      // Clear the scrollback buffer
      this.#displayOutput(ESCAPE_SEQ.CLEAR_SCROLLBACK_BUF);
      // Print the prompt
      this.#displayOutput(`\r${this.#colorPrompt()}`);
      this.#resetLine();
    };

    const handleCtrlU = (): void => {
      if (!this.isQueryMode) return;
      // Delete all characters from the cursor to the beginning of the line
      this.line = this.line.slice(this.cursor, this.line.length);
      this.#deletePrevCmd();
      this.cursor = 0;
      this.previousLines.length !== 0
        ? // Line from a multiple line query
          this.#displayOutput(`\r${'   '}${this.line}`)
        : // Line from a single line query
          this.#displayOutput(`\r${this.#colorPrompt()}${this.line}`);

      // Move cursor to the beginning of the line
      for (let i = this.line.length; i > 0; --i) {
        this.#displayOutput(KEYS.ARROW_LEFT);
      }
    };

    const handleEnter = async (): Promise<void> => {
      // When the user is executing 'empty queries' ---------------------------------
      if (this.isQueryMode && this.line.length === 0) {
        this.#displayOutput(`\r\n${this.#colorPrompt()}`);
        return;
      }

      // When the user is executing a query -----------------------------------------
      if (this.isQueryMode && this.line[this.line.length - 1] === '.') {
        // Stop the Top Level
        if (this.line.trim() === 'halt.') {
          this.#finishTopLevel();
          return;
        }

        this.#displayOutput('\r\n');
        // Join all the parts of the queries
        const command: string = this.previousLines.join('') + this.line;
        // Send the query
        await this.cproc.sendQuery(command);
        // Store the command
        this.commandRing.pushCommand(command);
        // Reset the possible previous lines of the query
        this.previousLines = [];
        this.#resetLine();
        return;
      }

      // Default query mode. Multiple line query
      if (this.isQueryMode) {
        // Register the previous line of the query
        this.previousLines.push(this.line);
        this.#resetLine();
        this.#displayOutput('\r\n   ');
        return;
      }

      // DEFAULT: Debug and solutions treatment -------------------------------------
      this.#displayOutput('\r\n');
      await this.cproc.sendQuery(this.line);
      this.#resetLine();
      return;
    };

    const handleDefaultCase = (): void => {
      // TODO: Reimplement the paste of the commands after the changes
      this.line =
        this.line.slice(0, this.cursor) +
        data +
        this.line.slice(this.cursor, this.line.length);

      this.cursor += data.length;
      this.#displayOutput(
        this.line.slice(this.cursor - data.length, this.line.length)
      );

      for (let i = this.cursor; i < this.line.length; ++i) {
        this.#displayOutput(KEYS.ARROW_LEFT);
      }
    };

    switch (data) {
      case KEYS.ARROW_LEFT:
        handleArrowLeft();
        break;
      case KEYS.ARROW_RIGHT:
        handleArrowRight();
        break;
      case KEYS.ARROW_UP:
        handleArrowUp();
        break;
      case KEYS.ARROW_DOWN:
        handleArrowDown();
        break;
      case KEYS.BACKSPACE:
        handleBackspace();
        break;
      case KEYS.ENTER:
        handleEnter();
        break;
      case KEYS.CTRL_A:
        handleCtrlA();
        break;
      case KEYS.CTRL_C:
        handleCtrlDC();
        break;
      case KEYS.CTRL_D:
        handleCtrlDC();
        break;
      case KEYS.CTRL_E:
        handleCtrlE();
        break;
      case KEYS.CTRL_K:
        handleCtrlK();
        break;
      case KEYS.CTRL_L:
        handleCtrlL();
        break;
      case KEYS.CTRL_U:
        handleCtrlU();
        break;
      default: {
        handleDefaultCase();
      }
    }
  }

  setDimensions(dimensions: TerminalDimensions): void {
    this.dimensions = dimensions;
  }

  async sendQuery(query: string): Promise<string> {
    // en este método, escribir la query en el pseudoterminal
    this.writeEmitter.fire(`${query}\r\n`);
    // guardar el comando en el command ring
    this.commandRing.pushCommand(query);
    // Esperar a que termine el comando
    return await this.cproc.sendQuery(query);
  }

  isRunning(): boolean {
    return this.cproc.isRunning();
  }

  #deletePrevCmd(): void {
    this.#deleteCurrentLine();
    this.previousLines.forEach(() => {
      // Delete the line (even if it fits in more than one line)
      this.#deleteCurrentLine();
      // Move the cursor one row up
      this.#displayOutput(ESCAPE_SEQ.PREVIOUS_LINE);
    });
    this.previousLines = [];
  }

  #deleteCurrentLine(deleteLine = true): void {
    let lineLength = this.line.length;
    if (!this.dimensions) return;
    // Handle the very big lines that need more than one PTY line to fit
    while (lineLength + this.promptLength > this.dimensions.columns) {
      // Delete line
      this.#displayOutput(ESCAPE_SEQ.CLEAR_LINE);
      // Move cursor one row up
      this.#displayOutput(ESCAPE_SEQ.PREVIOUS_LINE);
      // Reduce the length
      lineLength -= this.dimensions.columns;
    }
    // Clear the last line
    this.#displayOutput(ESCAPE_SEQ.CLEAR_LINE);
    if (deleteLine) {
      this.#resetLine();
    }
  }

  #resetLine(): void {
    this.line = '';
    this.cursor = 0;
  }

  #colorPrompt(): string {
    return `${COLORS.ORANGE}${this.prompt}${COLORS.RESET}`;
  }

  #formatOutput(output: string): string {
    const activeEditor = window.activeTextEditor;
    const msgs: string[] = [];
    output.split('\n').forEach((line) => {
      // Check if the line is a debugger mark line
      // Assuming that the debugger line comes all together?
      if (line.match(/ {9}In (.*) \(([0-9]+)-([0-9]+)\) (.*?)-([0-9]+)/g)) {
        const mark = parseDbgMsg(line);
        if (mark) {
          markDbgMarksOnCiaoSource(mark);
        }
        return;
      }
      // Green messages
      if (line.trim() === 'yes' || line.includes('PASSED')) {
        msgs.push(`${COLORS.GREEN}${line}${COLORS.RESET}`);
        return;
      }
      // Yellow messages
      if (line.trim() === 'no') {
        msgs.push(`${COLORS.YELLOW}${line}${COLORS.RESET}`);
        return;
      }
      // Red messages
      if (
        line.trim() === 'aborted' ||
        line.trim() === '** here **' ||
        line.includes('ERROR') ||
        line.includes('FAILED')
      ) {
        msgs.push(`${COLORS.RED}${line}${COLORS.RESET}`);
        return;
      }
      // Orange messages
      if (
        line === this.prompt ||
        line.trim() === '}' ||
        line.startsWith('Note: {') ||
        line.startsWith('{') ||
        line.includes('WARNING')
      ) {
        // When the prompt is printed, delete al debug marks (if any)
        activeEditor?.setDecorations(debuggerDecorationType, []);
        activeEditor?.setDecorations(debuggerDecorationAtom, []);
        msgs.push(`${COLORS.ORANGE}${line}${COLORS.RESET}`);
        return;
      }
      // Default messages
      msgs.push(line);
    });
    return `${msgs.join('\r\n')}`;
  }

  #displayOutput(output: string): void {
    this.writeEmitter.fire(output);
  }

  #finishTopLevel(): void {
    this.#displayOutput('\r\nCiao listener finished\r\n');
    this.cproc.exit();
    this.writeEmitter.dispose();
    return;
  }
}
