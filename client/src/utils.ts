import { mkdtempSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { window } from 'vscode';
import { getGlobalValue, setGlobalValue } from './contextManager';
import { ciaoInstallerCmd } from './constants';

/**
 * Opens a browser tab wit the URL specified.
 * @param url URL or path to open in the browser
 * @param cwd If specified, set the CWD of the process
 */
export function openBrowserTab(url: string, cwd?: string): void {
  const cmd: string = getGlobalValue<boolean>('WSL') ? 'explorer.exe' : 'open';
  spawn(cmd, [url], { cwd: cwd ?? homedir() });
}

/**
 * Encapsulates the command within single quotes and escapes single quotes
 * @param cmd Command to escape
 * @returns Escaped command
 */
export function shellQuote(cmd: string): string {
  return `'${cmd.replace(/'/g, "'\\''")}'`;
}

/**
 * Creates a temporary directory and returns
 * @param prefix prefix to use (if any)
 * @returns path of the created dir
 */
export function createTmpDir(prefix?: string): string {
  return mkdtempSync(join(`${tmpdir()}`, `${prefix}`));
}

/**
 * @returns Running in WSL or not
 */
export function isRunningInWSL(): boolean {
  return getGlobalValue<boolean>('WSL') ?? false;
}

/**
 * Sets in the local storage if the extension is running in WSL or not
 */
export function setRunningInWSL(): void {
  const { stdout } = spawnSync('grep', [
    'microsoft',
    '/proc/sys/kernel/osrelease',
  ]);

  setGlobalValue('WSL', !!String(stdout));
}

/**
 * @returns Ciao installed or not
 */
export function isCiaoInstalled(): boolean {
  const { stdout } = spawnSync('which', ['ciao']);

  return !!String(stdout);
}

/**
 * Once detected that Ciao is not installed in the system, prompt installation
 */
export async function ciaoNotInstalled(): Promise<void> {
  const selection = await window.showInformationMessage(
    'Ciao Prolog is not installed in the system. Would you like to install it?',
    ...['Install', 'Dismiss']
  );

  if (selection === 'Install') {
    promptCiaoInstallation();
  } else {
    window.showWarningMessage(
      'The extension will not work if Ciao is not installed in the system.'
    );
  }
}

/**
 * Prompts the Ciao Installer in a new terminal
 */
export function promptCiaoInstallation(): void {
  const term = window.createTerminal({ cwd: homedir() });
  term.show();
  term.sendText(ciaoInstallerCmd);
}
