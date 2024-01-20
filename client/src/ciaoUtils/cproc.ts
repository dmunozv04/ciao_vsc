'use strict';

import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { workspace } from 'vscode';
import { EXE, PROMPTS } from '../constants';
import { markErrorsOnCiaoSource } from './ciaoFile';
import type { Resolver, OutputCallback } from '../../../shared/types';
import { CiaoTopLevelKind, CiaoUserConfiguration } from '../../../shared/types';
import { parseErrorMsg } from '../../../shared/ciaoParse';

const getCwd = (): string => {
  return workspace.workspaceFolders !== undefined
    ? workspace.workspaceFolders[0].uri.fsPath
    : '/';
};

const getExecutableInfo = (
  procKind: CiaoTopLevelKind
): { exe: string; args: string[] } => {
  return EXE[procKind];
};

export class CProc {
  private outputCallback: OutputCallback;
  private resolveCommand: Resolver;
  private cproc: ChildProcessWithoutNullStreams | undefined;
  private procKind: CiaoTopLevelKind;
  private stdoutBuf: string;
  private stderrBuf: string;
  private errors: string;

  constructor(procKind: CiaoTopLevelKind, outputCallback: OutputCallback) {
    this.outputCallback = outputCallback;
    this.resolveCommand = null;
    this.procKind = procKind;
    this.stdoutBuf = '';
    this.stderrBuf = '';
    this.errors = '';
  }

  start(): Promise<CProc> {
    const cwd: string = getCwd();

    // Getting executable info
    const { exe, args } = getExecutableInfo(this.procKind);

    // Spawn the process
    this.cproc = spawn(exe, args, { cwd });

    // Return a promise that sets all the listeners
    return new Promise<CProc>((resolve) => {
      this.cproc?.on('error', this.handleError);
      this.cproc?.on('close', this.handleClose);
      this.cproc?.stderr.on('data', this.handleStderr);

      // Setup a 'once' listener to treat differentely the initial
      // prompt that is printed by 'ciaosh'
      this.cproc?.stdout.once('data', (data: Buffer) => {
        this.stdoutBuf += String(data);
        // Printing the first prompt of the Ciao Top Level
        this.outputCallback(this.stdoutBuf);
        this.stdoutBuf = '';
        // Setup the regular listener for subsequent data
        this.cproc?.stdout.on('data', this.handleStdout);
        resolve(this);
      });
    });
  }

  sendQuery(command: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.resolveCommand = resolve;
      this.cproc?.stdin?.write(`${command}\n`);
    });
  }

  exit(): void {
    this.cproc?.kill('SIGQUIT');
  }

  private isWaitingForInput = (): boolean => {
    return (
      this.stdoutBuf.endsWith(PROMPTS[this.procKind].text) ||
      this.stdoutBuf.endsWith(PROMPTS.PROMPTVAL.text)
    );
  };

  private handleStdout = (buffer: Buffer): void => {
    // Convert the buffer to string
    const data = String(buffer);

    // Buffering the data
    this.stdoutBuf += data;

    // If there's data in STDERR, send it and reset buffer
    if (this.stderrBuf.length !== 0) {
      this.errors = this.stderrBuf;
      this.outputCallback(this.stderrBuf);
      this.stderrBuf = '';
    }

    // Send the chunk of data to PTY
    this.outputCallback(data);

    // When the command is finished, reset the buffer and resolve the promise
    if (this.isWaitingForInput() && this.resolveCommand) {
      const userConfiguration = workspace
        .getConfiguration('ciao')
        .get<CiaoUserConfiguration>('checker');

      if (userConfiguration === 'off') {
        markErrorsOnCiaoSource(parseErrorMsg(this.errors));
      }

      // Resolve the promise
      this.resolveCommand(this.stdoutBuf);
      // Resetting variables
      this.resolveCommand = null;
      this.stdoutBuf = '';
      this.stderrBuf = '';
      this.errors = '';
    }
  };

  private handleStderr = (data: Buffer): void => {
    this.stderrBuf += String(data);
  };

  private handleError = (err: Error): void => {
    console.error(`error: ${err.message}`);
  };

  private handleClose = (
    code: number | null,
    signal: NodeJS.Signals | null
  ): void => {
    console.log(
      code
        ? `CProc exited with code ${code}`
        : `CProc exited with signal ${signal}`
    );
  };
}
