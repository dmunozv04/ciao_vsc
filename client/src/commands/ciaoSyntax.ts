'use strict';

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ConfigurationTarget,
  QuickPickItem,
  Uri,
  window,
  workspace,
} from 'vscode';
import type { EditorSettings, CiaoRule } from '../../../shared/types';

/**
 * Inserts the standard syntax highlighting rules for **Ciao Prolog**
 * into the user's ``settings.json`` file under the
 * ``editor.tokenColorCustomizations.textMateRules.`` contribution point.
 * Preserves previously added
 * rules by the user (if any).
 */
export async function selectSyntaxTheme(): Promise<void> {
  console.log(__dirname);
  const items: QuickPickItem[] = [
    {
      label: 'Dark',
      description: 'Syntax highlighting for dark themes',
      iconPath: Uri.file(
        path.join(__dirname, '..', '..', '..', 'public', 'images', 'moon.png')
      ),
    },
    {
      label: 'Light',
      description: 'Syntax highlighting for light themes',
      iconPath: Uri.file(
        path.join(__dirname, '..', '..', '..', 'public', 'images', 'sun.png')
      ),
    },
  ];
  const selected = await window.showQuickPick(items, {
    placeHolder: 'Select an option',
  });
  if (!selected) return;
  const sourceFile =
    selected.label === 'Dark'
      ? 'ciao.dark.tmTheme.json'
      : 'ciao.light.tmTheme.json';
  const filePath = path.join(__dirname, '..', '..', '..', 'themes', sourceFile);
  try {
    // Reading theme source file
    const jsonObject = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Retrieving and merging other textMateRules defined by the user
    const previousTextMateRules = workspace
      .getConfiguration('editor.tokenColorCustomizations')
      .get<CiaoRule[]>('textMateRules', [])
      .filter((rule: CiaoRule) => rule.name !== 'ciao-rule');
    const textMateRules = [
      ...previousTextMateRules,
      ...jsonObject.textMateRules,
    ];
    // Retrieving and merging other tokenColorConfigurations defined by user
    const previousSettings = workspace
      .getConfiguration('editor')
      .get<EditorSettings>('tokenColorCustomizations', {});
    previousSettings.textMateRules = textMateRules;
    workspace
      .getConfiguration('editor')
      .update(
        'tokenColorCustomizations',
        previousSettings,
        ConfigurationTarget.Global
      );
  } catch (error) {
    window.showErrorMessage(
      `Ciao: Error in reading ${selected.label} theme from source`
    );
  }
}

/**
 * Deletes **Ciao Prolog** custom syntax rules. Preserves previously added
 * rules by the user (if any).
 */
export function disableSyntaxTheme(): void {
  // Retrieving other rules not from Ciao
  const notCiaoRules = workspace
    .getConfiguration('editor.tokenColorCustomizations')
    .get<CiaoRule[]>('textMateRules', [])
    .filter((rule: CiaoRule) => rule.name !== 'ciao-rule');
  // Retrieving and merging other tokenColorConfigurations defined by user
  const previousSettings = workspace
    .getConfiguration('editor')
    .get<EditorSettings>('tokenColorCustomizations', {});
  previousSettings.textMateRules = notCiaoRules;
  workspace
    .getConfiguration('editor')
    .update(
      'tokenColorCustomizations',
      previousSettings,
      ConfigurationTarget.Global
    );
}
