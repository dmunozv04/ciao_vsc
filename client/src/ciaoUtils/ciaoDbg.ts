'use strict';

import type { DebugMark } from '../../../shared/types';
import { translatePath } from './ciaoFile';

/**
 * Parses a debugger message and returns the information
 * @param msg Debugger message to parse
 * @returns Object containing all the extracted information
 */
export function parseDbgMsg(msg: string): DebugMark | undefined {
  const dbgMarkerRegex = / {9}In (.*) \(([0-9]+)-([0-9]+)\) (.*?)-([0-9]+)/g;
  const [match] = [...msg.matchAll(dbgMarkerRegex)];
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
