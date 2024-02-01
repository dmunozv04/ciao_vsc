'use strict';

import * as path from 'node:path';
import { Disposable, Terminal, TerminalLocation, Uri, window } from 'vscode';
import { CiaoTopLevelKind } from '../../../shared/types';
import { TERMINAL_NAMES } from '../constants';
import { CiaoPTY } from './ciaoPTY';

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
 * Methods:
 * @method `start()` Spawns the underlying process and starts the `Terminal`
 * @method `sendQuery(query)` Executes a given query in an existing
 * **Ciao Top Level** instance.
 * @method `dispose()` Disposes all the resources of the **Ciao Top Level**
 */
export class CiaoTopLevel implements Disposable {
  private terminal: Terminal | undefined;
  private topLevelKind: CiaoTopLevelKind;
  private pty: CiaoPTY | undefined;

  constructor(kind: CiaoTopLevelKind) {
    this.topLevelKind = kind;
  }

  async start(): Promise<CiaoTopLevel> {
    const name: string = TERMINAL_NAMES[this.topLevelKind];
    this.pty = await new CiaoPTY(this.topLevelKind).open();
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
  dispose(): void {
    this.terminal?.dispose();
  }
  async sendQuery(query: string): Promise<string | undefined> {
    return await this.pty?.sendQuery(query);
  }
  isRunning(): boolean {
    return this.pty?.isRunning() ?? false;
  }
  show(): void {
    this.terminal?.show();
  }
}
