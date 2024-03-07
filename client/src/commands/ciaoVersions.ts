'use strict';

import { spawnSync } from 'node:child_process';
import { window, QuickPickItem, workspace } from 'vscode';
import {
  searchAllCiaoVersions,
  searchUserDefinedCiaoVersions,
  updateUserDefinedCiaoVersions,
} from '../utils';
import { CiaoEnvVars, CiaoVersion } from 'shared/types';
import { setGlobalValue } from '../contextManager';

/**
 * Prompts the selection of all the available Ciao installations
 * in the system behind `.ciaoroot`
 */
export async function selectCiaoVersion(): Promise<void> {
  const selected = <CiaoVersion | undefined>(
    await showCiaoVersions(searchAllCiaoVersions())
  );

  if (!selected) {
    return;
  }

  try {
    const envVars: CiaoEnvVars = getEnvVarsFromVersionPath(selected.path);
    // Save the EnvVars to the GlobalStorage
    setGlobalValue('CIAO-ENV', envVars);
    window.showInformationMessage('Ciao Version Succesfully Changed');
  } catch (error) {
    window.showErrorMessage((error as Error).message);
  }
}

/**
 * Register a new ciao version in `settings.json`
 */
export async function registerNewCiaoVersion(): Promise<void> {
  const versions = searchUserDefinedCiaoVersions();

  const name = await window.showInputBox({
    title: 'Name',
    placeHolder: 'Enter the name of your custom Ciao installation',
  });

  if (!name || versions.map(({ name }) => name).includes(name)) {
    window.showErrorMessage(
      'You must provide a unique name for the Ciao Installation'
    );
    return;
  }

  const path = await window.showInputBox({
    title: 'PATH',
    placeHolder: 'Enter the PATH of your Ciao Installation',
  });

  if (!path) {
    window.showErrorMessage(
      'You must provide a path for the Ciao Installation'
    );
    return;
  }

  updateUserDefinedCiaoVersions([...versions, { name, path }]);

  window.showInformationMessage('Ciao Version Succesfully Registered');
}

/**
 * Remove a ciao version from `settings.json`
 * @param name Name of the version to remove
 */
export async function removeCiaoVersion(): Promise<void> {
  const selected = <CiaoVersion | undefined>(
    await showCiaoVersions(searchUserDefinedCiaoVersions())
  );

  if (!selected) return;

  const versions = workspace
    .getConfiguration('ciao')
    .get<CiaoVersion[]>('versions', []);

  updateUserDefinedCiaoVersions(
    versions.filter((v) => v.name !== selected.name)
  );

  window.showInformationMessage('Ciao Version Succesfully Removed');
}

/**
 * Show all the Ciao Versions in a QuickPick
 * @returns The option selected by user or undefined
 */
async function showCiaoVersions(
  ciaoVersions: CiaoVersion[]
): Promise<QuickPickItem | undefined> {
  if (ciaoVersions.length === 0) {
    window.showWarningMessage(
      'There are no Ciao Versions installed under ~/.ciaoroot directory or manually defined.'
    );
    return;
  }

  const items = ciaoVersions.map<QuickPickItem>(({ path, name }) => ({
    name,
    path,
    label: name,
    description: path,
  }));

  return window.showQuickPick(items, {
    placeHolder: 'Select an installed Ciao Version',
  });
}

/**
 * @param versionPath The path to the specific Ciao Version
 * @returns An object with all the custon Ciao Env Variables
 */
function getEnvVarsFromVersionPath(versionPath: string): CiaoEnvVars {
  let commandOutput;

  try {
    const {
      output: [, stdout],
    } = spawnSync(`${versionPath}/build/bin/ciao-env`, ['--sh']);
    commandOutput = stdout;
  } catch {
    throw new Error(
      `${versionPath} is not a valid Ciao path. Reconfigure or delete this Ciao Version`
    );
  }

  const baseCase: CiaoEnvVars = {
    PATH: '',
    MANPATH: '',
    INFOPATH: '',
    CIAOENGINE: '',
    CIAOHDIR: '',
    CIAOROOT: '',
  };

  return commandOutput
    ? commandOutput
        .toString()
        .split('\n')
        .slice(0, -4)
        .reduce<CiaoEnvVars>((acc, line) => {
          const [key, value] = line.slice(7).split('=');
          // @ts-expect-error We assume that processCiaoEnvVars will always be called with the result of ciao-env --sh
          acc[key] = value.slice(1, -1);
          return acc;
        }, {})
    : // In case the stdout is not defined, return a default object
      baseCase;
}
