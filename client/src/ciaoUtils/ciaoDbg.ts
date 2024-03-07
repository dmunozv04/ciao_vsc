'use strict';

import type { DebugMark } from '../../../shared/types';
import { translatePath } from './ciaoFile';

const DBG_MARK_REGEX = / {9}In (.*) \(([0-9]+)-([0-9]+)\) (.*?)-([0-9]+)/g;

/**
 * Determines wether the line is a debugging line or not
 * @param line Output line to check
 * @returns `true` if it is, `false` otherwise
 */
export function isDebuggerLine(line: string): boolean {
  return DBG_MARK_REGEX.test(line);
}

/**
 * Parses a debugger message and returns the information
 * @param msg Debugger message to parse
 * @returns Object containing all the extracted information
 */
export function parseDbgMsg(msg: string): DebugMark | undefined {
  const [match] = [...msg.matchAll(DBG_MARK_REGEX)];
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
