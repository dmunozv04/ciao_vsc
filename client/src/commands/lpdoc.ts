'use strict';

import { QuickPickItem, window } from 'vscode';
import { sep } from 'node:path';
import { execSync } from 'node:child_process';
import {
  getActiveCiaoFileName,
  getActiveCiaoFilePath,
} from '../ciaoUtils/ciaoFile';
import { createTmpDir } from '../utils';
import { shellQuote } from '../utils';

const formats = ['HTML', 'PDF', 'MANL', 'INFO'];

/**
 * Generates **LPdoc** documentation for the current **Ciao
 * Prolog** file. Displays a *Quick Pick* for the user to
 * choose the output format.
 */
export async function genDoc(): Promise<void> {
  const filePath = getActiveCiaoFilePath();

  if (!filePath) {
    window.showErrorMessage('Please load a Ciao Prolog file.');
    return;
  }

  const items: QuickPickItem[] = formats.map((format) => {
    return {
      label: format,
      description: `Generates the documentation in ${format} format.`,
    };
  });

  const selected = await window.showQuickPick(items, {
    placeHolder: 'Select an option',
  });

  if (!selected) return;

  const format = selected.label.toLowerCase();

  try {
    execSync(`lpdoc -t ${format} ${shellQuote(filePath)}`);
    window.showInformationMessage(
      'LPdoc: Documentation generated succesfully.'
    );
  } catch (error) {
    window.showErrorMessage((error as Error).message);
  }
}
/**
 * Opens a previously generated **LPdoc** documentation for
 * the current **Ciao Prolog** file.
 */
export async function showDoc(): Promise<void> {
  const filePath = getActiveCiaoFilePath();

  if (!filePath) {
    window.showErrorMessage('Please load a Ciao Prolog file.');
    return;
  }

  const items: QuickPickItem[] = formats.map((format) => {
    return {
      label: format,
      description: `Displays the documentation in ${format} format.`,
    };
  });

  const selected = await window.showQuickPick(items, {
    placeHolder: 'Select an option',
  });

  if (!selected) return;

  const format = selected.label.toLowerCase();

  try {
    execSync(`lpdoc -t ${format} --view ${shellQuote(filePath)}`);
    window.showInformationMessage(
      'LPdoc: Documentation displayed succesfully.'
    );
  } catch (error) {
    window.showErrorMessage((error as Error).message);
  }
}
/**
 * Generates (in a temporary directory) and displays a preview
 * of the **LPdoc** documentation for the current **Ciao Prolog**
 * file in HTML format
 */
export function previewDoc(): void {
  const filePath = getActiveCiaoFilePath();

  if (!filePath) {
    window.showErrorMessage('Please load a Ciao Prolog file.');
    return;
  }
  let stderrBuffer: string = '';
  // Generating the random dir
  const dir: string = createTmpDir(getActiveCiaoFileName() + '_');
  // Commands to be executed
  const genDocCmd = `lpdoc -t html --output_dir=${dir} ${quote([filePath])}`;
  const symLinkCmd = `ln -s ${quote([filePath])} ${
    dir + sep + getActiveCiaoFileName()
  }`;
  const viewDocCmd = `lpdoc -t html --view ${
    dir + sep + getActiveCiaoFileName()
  }`;
  // Executing the commands
  const lpdoc: ChildProcess = exec(
    `${genDocCmd} && ${symLinkCmd} && ${viewDocCmd}`
  );
  // Capturing stderr
  lpdoc.stderr.on('data', (data) => {
    stderrBuffer += data.toString();
  });
  // Show errors if any
  lpdoc.on('close', (exitCode) => {
    if (exitCode !== 0) {
      window.showErrorMessage(stderrBuffer);
    }
  });
  if (selected) {
    const format: string = selected.label.toLowerCase();
    let stderrBuffer: string = '';
    const lpdoc: ChildProcess = spawn('lpdoc', [
      '-t',
      format,
      '--view',
      filePath,
    ]);
    lpdoc.stderr.on('data', (data) => {
      stderrBuffer += data.toString();
    });
    lpdoc.on('close', (exitCode) => {
      if (exitCode === 0) {
        window.showInformationMessage(
          'LPdoc: Documentation successfully displayed.'
        );
      } else {
        window.showErrorMessage(stderrBuffer);
      }
    });
  }
}

/**
 * Generates (in a temporary directory) and displays a preview
 * of the **LPdoc** documentation for the current **Ciao Prolog**
 * file in HTML format
 */
export function previewDoc(): void {
  const filePath: string | undefined = getActiveCiaoFilePath();
  if (!filePath) {
    window.showErrorMessage('Ciao: Please load a Ciao Prolog file.');
    return;
  }

  // Generating the random dir
  const dir: string = createTmpDir(getActiveCiaoFileName() + '_');

  // Commands to be executed
  const genDocCmd = `lpdoc -t html --output_dir=${shellQuote(dir)} ${shellQuote(
    filePath
  )}`;

  const symLinkCmd = `ln -s ${shellQuote(filePath)} ${shellQuote(
    `${dir}${sep}${getActiveCiaoFileName()}`
  )}`;

  const viewDocCmd = `lpdoc -t html --view ${shellQuote(
    `${dir}${sep}${getActiveCiaoFileName()}`
  )}`;

  // Executing the commands
  try {
    execSync(`${genDocCmd} && ${symLinkCmd} && ${viewDocCmd}`);
    window.showInformationMessage(
      'LPdoc: Documentation generated and displayed.'
    );
  } catch (error) {
    window.showErrorMessage((error as Error).message);
  }
}
