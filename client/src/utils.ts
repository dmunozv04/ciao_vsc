'use strict';

import * as os from 'node:os';
import { mkdtempSync, readdirSync } from 'node:fs';
import path, { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { Uri, Webview, commands, window, workspace } from 'vscode';
import { getGlobalValue, setGlobalValue } from './contextManager';
import { ciaoInstallerCmd } from './constants';
import { type OS, type CiaoVersion } from '../../shared/types';

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
  return `'${cmd.replace(/'/, "'\\''")}'`;
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
    'Install',
    'Dismiss'
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

/**
 * Prompts a message asking the user to save the current workspace files
 */
async function promptToSaveFiles(): Promise<void> {
  const choice = await window.showInformationMessage(
    'Some Ciao files are not saved. Do you want to save them before continuing?',
    'Yes',
    'No'
  );

  choice === 'Yes' && (await saveFiles());
}

/**
 * Saves all the unsaved files in the current workspace
 */
async function saveFiles(): Promise<void> {
  const ciaoFilesPromises = workspace.textDocuments
    .filter((file) => file.languageId === 'ciao')
    .map((file) => file.save());

  await Promise.all(ciaoFilesPromises);
}

/**
 * @returns An array containing all the information of the installed Ciao versions
 * under the `.ciaoroot` directory and the versions defined by the user in `settings.json`
 */
export function searchAllCiaoVersions(): CiaoVersion[] {
  return [...searchAutomaticCiaoVersions(), ...searchUserDefinedCiaoVersions()];
}

/**
 * @returns All the Ciao Versions under `.ciaoroot` and the PATH version.
 */
export function searchAutomaticCiaoVersions(): CiaoVersion[] {
  const ciaoVersionsPath = `${os.homedir()}/.ciaoroot`;

  // Get the Ciao Version in the PATH
  const ciaoPathVersion = getCiaoVersionFromPath();

  try {
    const ciaoVersions: CiaoVersion[] = readdirSync(ciaoVersionsPath, {
      withFileTypes: true,
    })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .map((ciaoPathName) =>
        parseCiaoVersion(`${ciaoVersionsPath}/${ciaoPathName}`, ciaoPathName)
      );

    return [...(ciaoPathVersion ? [ciaoPathVersion] : []), ...ciaoVersions];
  } catch {
    return [];
  }
}

/**
 * @returns All the Ciao Versions defined manually by the user.
 */
export function searchUserDefinedCiaoVersions(): CiaoVersion[] {
  return workspace.getConfiguration('ciao').get<CiaoVersion[]>('versions', []);
}

/**
 * Updates the Ciao Versions inside `settings.json`
 * @param ciaoVersions The new array of versions
 */
export function updateUserDefinedCiaoVersions(
  ciaoVersions: CiaoVersion[]
): void {
  workspace.getConfiguration('ciao').update('versions', ciaoVersions, true);
}

/**
 * @param ciaoPathName The name of the directory with a Ciao version
 * @returns An object with the information parsed
 */
export function parseCiaoVersion(
  absolutePath: string,
  ciaoPathName: string
): CiaoVersion {
  const versionRegex = /^v([^-]*)-([^-]*)-?([^-]*)?/g;
  const [, versionNumber] = [...ciaoPathName.matchAll(versionRegex)][0];

  const ciaoVersion: CiaoVersion = {
    path: absolutePath,
    name: versionNumber,
  };

  return ciaoVersion;
}

/**
 * Function that prompts a message to the user asking if
 * they want to reload VSCode
 */
export async function askUserToReloadVSCode(): Promise<void> {
  const choice = await window.showInformationMessage(
    'Please reload Visual Studio Code to apply the changes',
    'Restart Now'
  );

  choice === 'Restart Now' && (await reloadVSCode());
}

/**
 * Reload VSCode window
 */
export async function reloadVSCode(): Promise<void> {
  const restartAction = 'workbench.action.reloadWindow';
  try {
    await commands.executeCommand(restartAction);
  } catch {
    window.showErrorMessage('Failed to restart VSCode');
  }
}

/**
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 *
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 *
 * @returns A nonce
 */
export function getNonce(): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

/*
 * @returns Path of the Ciao Version inside the PATH
 */
function getCiaoVersionFromPath(): CiaoVersion | undefined {
  // Obtain the ciao version in the PATH
  const {
    output: [, stdout],
  } = spawnSync('which', ['ciao']);

  return stdout
    ? {
      name: 'PATH',
      path: stdout.toString().split(path.sep).slice(0, -3).join(path.sep),
    }
    : undefined;
}
