'use strict';

import type { DebugMark } from '../../../shared/types';
import { dbgMarkRegex } from '../constants';
import { translatePath } from './ciaoFile';

/**
 * Determines wether the line is a debugging line or not
 * @param line Output line to check
 * @returns `true` if it is, `false` otherwise
 */
export function isDebuggerLine(line: string): boolean {
  return dbgMarkRegex.test(line);
}

/*
 * Useful regexes?
 *
 *     [/^   [0-9]+  [0-9]+  Call: /m, 'comment'],
 *     [/^   [0-9]+  [0-9]+  Exit: /m, 'comment'],
 *     [/^   [0-9]+  [0-9]+  Redo: /m, 'comment'],
 *     [/^   [0-9]+  [0-9]+  Fail: /m, 'comment'],
 *
 */

/**
 * Parses a debugger message and returns the information
 * @param msg Debugger message to parse
 * @returns Object containing all the extracted information
 */
export function parseDbgMsg(msg: string): DebugMark | undefined {
  const match = msg.match(dbgMarkRegex);
  if (!match) return;
  const [, srcFile, startLine, endLine, predName, nthPred] = match;
  return {
    predName,
    srcFile: translatePath(srcFile),
    nthPred: Number(nthPred),
    startLine: Number(startLine) - 1,
    endLine: Number(endLine) - 1,
  };
}
