'use strict';

import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { workspace, window } from 'vscode';
import { EXE, PROMPTS } from '../constants';
import { markErrorsOnCiaoSource } from './ciaoFile';
import { isDebuggerLine } from './ciaoDbg';
import type {
  Resolver,
  OutputCallback,
  CiaoEnvVars,
} from '../../../shared/types';
import { CiaoTopLevelKind, CiaoUserConfiguration } from '../../../shared/types';
import { parseErrorMsg } from '../../../shared/ciaoParse';
import { getGlobalValue } from '../contextManager';

const getCwd = (): string => {
  return workspace.workspaceFolders
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
  private resolveCommand: Resolver | undefined;
  private cproc: ChildProcessWithoutNullStreams | undefined;
  private procKind: CiaoTopLevelKind;
  private commandOutputBuf: string;
  private stdoutBuf: string;
  private stderrBuf: string;
  private errors: string;
  private flushTimeout: NodeJS.Timeout | undefined;

  constructor(procKind: CiaoTopLevelKind, outputCallback: OutputCallback) {
    this.outputCallback = outputCallback;
    this.procKind = procKind;
    this.commandOutputBuf = '';
    this.stdoutBuf = '';
    this.stderrBuf = '';
    this.errors = '';
  }

  start(): Promise<CProc> {
    const cwd: string = getCwd();

    // Getting executable info
    const { exe, args } = getExecutableInfo(this.procKind);

    // Obtain ENV variables of the Ciao Version
    const ciaoEnv: CiaoEnvVars = getGlobalValue('CIAO-ENV', {});

    // Spawn the process
    this.cproc = spawn(exe, args, {
      cwd,
      env: {
        ...process.env,
        ...ciaoEnv,
      },
    });

    // Return a promise that sets all the listeners
    return new Promise<CProc>((resolve) => {
      this.cproc?.on('exit', this.handleExit);
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

  flush(): void {
    // TODO: Handle stderr?
    if (!this.stdoutBuf) return;
    this.outputCallback(this.stdoutBuf);
    this.commandOutputBuf += this.stdoutBuf;
    this.stdoutBuf = '';
  }

  // FIXME: NodeJS intercepts the signal before the CProc?
  interrupt(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.resolveCommand = resolve;
      this.cproc?.kill('SIGINT');
    });
  }

  sendQuery(command: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.resolveCommand = resolve;
      this.cproc?.stdin?.write(`${command}\n`);
    });
  }

  isRunning(): boolean {
    return (
      !!this.cproc &&
      this.cproc.exitCode === null &&
      (this.cproc.signalCode === null || this.cproc.signalCode === 'SIGINT')
    );
  }

  exit(): void {
    this.cproc?.kill('SIGQUIT');
  }

  private isWaitingForQuit = (): boolean =>
    this.stdoutBuf.endsWith(PROMPTS.PROMPT_QUIT.text);

  private isWaitingForResponse = (): boolean =>
    this.stdoutBuf.endsWith(PROMPTS.PROMPTVAL.text);

  private isWaitingForInput = (): boolean =>
    this.stdoutBuf.endsWith(PROMPTS[this.procKind].text) ||
    this.isWaitingForResponse() ||
    this.isWaitingForQuit();

  private handleExit = (_code: number, _signal: string) => {
    this.outputCallback('\r\nCiao Listener finished\r\n\n');
  };

  private handleStdout = (buffer: Buffer): void => {
    // Buffering the data
    this.stdoutBuf += String(buffer);

    // Buffering all the output of the command
    this.commandOutputBuf += String(buffer);

    // Clear the previous flushTimeout
    clearTimeout(this.flushTimeout);

    // If there's data in STDERR, send it and reset buffer
    if (this.stderrBuf.length > 0) {
      this.errors = this.stderrBuf;
      this.outputCallback(this.stderrBuf);
      this.stderrBuf = '';
    }

    // Split the stdout in the last '\n'
    const lines = this.stdoutBuf.split('\n');

    // Do not add an additional new line character if the buffer only has one line,
    // or if the previous line is a debugging information line.
    // TODO: Better implementation?
    const rest = `${lines.length === 1 || isDebuggerLine(lines[lines.length - 2]) ? '' : '\n'
      }${lines.pop()}`;
    const data = lines.join('\n');

    // Buffer the rest of data or restart buffer
    this.stdoutBuf = rest ?? '';

    // Send the data to the PTY
    this.outputCallback(data);

    // Set the flushTimeout in case there is data in stdout without newlines
    this.flushTimeout = setTimeout(this.flush.bind(this), 300);

    // When the command is finished, reset the buffer and resolve the promise
    if (this.isWaitingForInput() && this.resolveCommand) {
      // Print the promt
      this.outputCallback(this.stdoutBuf);

      // Check if the user wants to mark errors on save
      const userConfiguration = workspace
        .getConfiguration('ciao')
        .get<CiaoUserConfiguration>('checker');

      if (userConfiguration === 'off') {
        markErrorsOnCiaoSource(parseErrorMsg(this.errors));
      }

      // Resolve the promise
      this.resolveCommand(this.commandOutputBuf);
      // Resetting variables
      this.resolveCommand = undefined;
      this.commandOutputBuf = '';
      this.stdoutBuf = '';
      this.stderrBuf = '';
      this.errors = '';
    }
  };

  private handleStderr = (data: Buffer): void => {
    this.stderrBuf += String(data);
  };
}
