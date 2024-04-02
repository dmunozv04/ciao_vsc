'use strict';

import * as path from 'node:path';
import { Disposable, Terminal, TerminalLocation, Uri, window } from 'vscode';
import { CiaoTopLevelKind } from '../../../shared/types';
import { TERMINAL_NAMES } from '../constants';
import { CiaoPTY } from './ciaoPTY';
import { CommandRing } from './ciaoCommandRing';

/**
 *
 * @param kind What **Ciao Top Level** to get
 * @returns The `Terminal` Object or undefined if not found
 */
export function getTopLevel(kind: CiaoTopLevelKind): Terminal | undefined {
  return window.terminals.find((t) => t.name === TERMINAL_NAMES[kind]);
}

/**
 * Class that represents the **Ciao Top Level** implementation.
 */
export class CiaoTopLevel implements Disposable {
  private commandRing: CommandRing;
  private topLevelKind: CiaoTopLevelKind;
  private terminal: Terminal | undefined;
  private pty: CiaoPTY | undefined;

  constructor(kind: CiaoTopLevelKind) {
    this.commandRing = new CommandRing();
    this.topLevelKind = kind;
  }

  /**
   * Starts the Ciao Top Level with the CiaoPTY and the CProc.
   * @returns A promise containing the active Ciao Top Level
   */
  async start(): Promise<CiaoTopLevel> {
    const name = TERMINAL_NAMES[this.topLevelKind];
    this.pty = await new CiaoPTY(this.commandRing, this.topLevelKind).open();
    this.terminal = window.createTerminal({
      name,
      iconPath: Uri.file(
        path.join(__dirname, '..', '..', '..', 'public', 'images', 'ciao.png')
      ),
      pty: this.pty,
      location: TerminalLocation.Panel,
    });
    this.terminal.show();
    return this;
  }

  /**
   * Restart the Ciao PTY and CProc without disposing the terminal.
   */
  async restart(): Promise<void> {
    return this.pty?.restart();
  }

  /**
   * Dispose the terminal and all its resources associated.
   */
  dispose(): void {
    this.terminal?.dispose();
  }

  /**
   * Sends a query to the CiaoPTY and returns a promise that will
   * resolve when the command is finished.
   * @param query The query to send the toplevel
   */
  sendQuery(query: string): Promise<string> | undefined {
    return this.pty?.sendQuery(query);
  }

  /**
   * @returns Wether the CiaoPTY is running or not
   */
  isRunning(): boolean {
    return this.pty?.isRunning() ?? false;
  }

  /**
   * Show the toplevel panel and reveal this toplevel in the UI.
   * @param preserveFocus When `true` the terminal will not take focus.
   */
  show(): void {
    this.terminal?.show();
  }
}
