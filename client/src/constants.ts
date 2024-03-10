'use strict';

import { window } from 'vscode';
import { CiaoTopLevelKind } from '../../shared/types';

export const ciaoInstallerCmd = 'curl https://ciao-lang.org/boot -sSfL | sh';

export const dbgMarkRegex =
  / {0,9}In (.*) \(([0-9]+)-([0-9]+)\) (.*?)-([0-9]+)/;

export const debuggerDecorationType = window.createTextEditorDecorationType({
  backgroundColor: 'rgba(75, 119, 148, 0.3)',
  isWholeLine: true,
});

export const debuggerDecorationAtom = window.createTextEditorDecorationType({
  backgroundColor: 'rgba(75, 119, 148, 0.3)',
  borderStyle: 'solid',
  borderColor: 'blue',
});

export const COLORS = {
  RED: '\u001B[38;5;196m',
  GREEN: '\u001B[38;5;40m',
  YELLOW: '\u001B[38;5;220m',
  ORANGE: '\u001B[38;5;214m',
  RESET: '\u001B[0m',
};

export const KEYS = {
  /**
   * TODO: Handle Shift + Arrow
   */
  ENTER: '\r',
  BACKSPACE: '\u007F',
  SEMICOLON: ';',
  ARROW_UP: '\u001B[A',
  ARROW_DOWN: '\u001B[B',
  ARROW_RIGHT: '\u001B[C',
  ARROW_LEFT: '\u001B[D',
  CTRL_A: '\u0001',
  CTRL_C: '\u0003',
  CTRL_D: '\u0004',
  CTRL_E: '\u0005',
  CTRL_K: '\u000B',
  CTRL_L: '\u000C',
  CTRL_U: '\u0015',
};

export const TERMINAL_NAMES = {
  [CiaoTopLevelKind.TopLevel]: 'Ciao Top Level',
  [CiaoTopLevelKind.LPdoc]: 'LPdoc Top Level',
  [CiaoTopLevelKind.CiaoPP]: 'CiaoPP Top Level',
};

export const PROMPTS = {
  [CiaoTopLevelKind.TopLevel]: { text: '?- ', length: 3 },
  [CiaoTopLevelKind.LPdoc]: { text: 'lpdoc ?- ', length: 9 },
  [CiaoTopLevelKind.CiaoPP]: { text: 'ciaopp ?- ', length: 10 },
  PROMPTVAL: { text: ' ? ', length: 3 },
};

export const EXE = {
  [CiaoTopLevelKind.TopLevel]: { exe: 'ciaosh', args: ['-i'] },
  [CiaoTopLevelKind.LPdoc]: { exe: 'lpdoc', args: ['-T', '-i'] },
  [CiaoTopLevelKind.CiaoPP]: { exe: 'ciaopp', args: ['-T', '-i'] },
};

export const ESCAPE_SEQ = {
  PREVIOUS_LINE: '\u001B[F',
  FIRST_LINE: '\u001B[H',
  DELETE_CHAR: '\u001B[P',
  CLEAR_SCREEN: '\u001B[2J',
  CLEAR_LINE: '\u001B[2K',
  CLEAR_SCROLLBACK_BUF: '\u001B[3J',
};
