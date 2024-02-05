'use strict';

import * as os from 'node:os';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { window, workspace } from 'vscode';
import { getGlobalValue, setGlobalValue } from './contextManager';
import { ciaoInstallerCmd } from './constants';
import { type OS } from '../../shared/types';

const openerCommands: { [K in OS]: string } = {
  darwin: 'open',
  linux: 'xdg-open',
  wsl: 'wslview',
  unknown: 'false',
};

/**
 * Opens a browser tab wit the URL specified.
 * @param url URL or path to open in the browser
 * @param cwd If specified, set the CWD of the process
 */
export function openBrowserTab(url: string, cwd?: string): void {
  const cmd: string = openerCommands[getOS()];
  spawn(cmd, [url], { cwd: cwd ?? os.homedir() });
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
  return mkdtempSync(join(`${os.tmpdir()}`, `${prefix}`));
}

/**
 * @returns OS
 */
export function getOS(): OS {
  return getGlobalValue<OS>('OS', 'unknown');
}

/**
 * Sets in the local storage the OS in which the extension in executing
 */
export function setOS(): void {
  switch (os.platform()) {
    case 'linux': {
      const { status } = spawnSync('grep', [
        'microsoft',
        '/proc/sys/kernel/osrelease',
      ]);
      setGlobalValue<OS>('OS', status === 0 ? 'wsl' : 'linux');
      break;
    }
    case 'darwin': {
      setGlobalValue<OS>('OS', 'darwin');
      break;
    }
    default: {
      setGlobalValue<OS>('OS', 'unknown');
      break;
    }
  }
}

/**
 * @returns Ciao installed or not
 */
export function isCiaoInstalled(): boolean {
  const { status } = spawnSync('which', ['ciao']);
  return status === 0;
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
  const term = window.createTerminal({ cwd: os.homedir() });
  term.show();
  term.sendText(`${ciaoInstallerCmd} && exit 0`);
}

/**
 * Checks for unsaved files and prompts a message to save them
 */
export async function checkNotSavedFiles(): Promise<void> {
  const unsavedCiaoFiles = workspace.textDocuments.some(
    (doc) => doc.languageId === 'ciao' && doc.isDirty
  );

  if (!unsavedCiaoFiles) return;

  await promptToSaveFiles();
}

async function promptToSaveFiles(): Promise<void> {
  const choice = await window.showInformationMessage(
    'Some Ciao files are not saved. Do you want to save them before continuing?',
    'Yes',
    'No'
  );

  choice === 'Yes' && (await saveFiles());
}

async function saveFiles(): Promise<void> {
  const ciaoFilesPromises = workspace.textDocuments
    .filter((file) => file.languageId === 'ciao')
    .map((file) => file.save());

  await Promise.all(ciaoFilesPromises);
}
