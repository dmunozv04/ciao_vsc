'use strict';

import { window } from 'vscode';
import { CiaoTopLevelKind } from '../../shared/types';

export const ciaoInstallerCmd = 'curl https://ciao-lang.org/boot -sSfL | sh';

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
  RED: '\x1b[38;5;196m',
  GREEN: '\x1b[38;5;40m',
  YELLOW: '\x1b[38;5;220m',
  ORANGE: '\x1b[38;5;214m',
  RESET: '\x1b[0m',
};

export const KEYS = {
  /**
   * TODO: Handle Shift + Arrow
   */
  ENTER: '\r',
  BACKSPACE: '\x7f',
  SEMICOLON: ';',
  ARROW_UP: '\x1b[A',
  ARROW_DOWN: '\x1b[B',
  ARROW_RIGHT: '\x1b[C',
  ARROW_LEFT: '\x1b[D',
  CTRL_A: '\x01',
  CTRL_D: '\x04',
  CTRL_E: '\x05',
  CTRL_K: '\x0B',
  CTRL_L: '\x0C',
  CTRL_U: '\x15',
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
  PREVIOUS_LINE: '\x1b[F',
  FIRST_LINE: '\x1b[H',
  DELETE_CHAR: '\x1b[P',
  CLEAR_SCREEN: '\x1b[2J',
  CLEAR_LINE: '\x1b[2K',
  CLEAR_SCROLLBACK_BUF: '\x1b[3J',
};
