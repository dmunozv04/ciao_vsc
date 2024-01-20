'use strict';

import type { CiaoDiagnosticInfo, CiaoDiagnostics } from './types';

/**
 * Parses the compilation messages after loading a **Ciao Prolog** file
 * in the **Ciao Top Level**.
 *
 * TODO: Better implementation?
 * Cannot handle \@...{...} statements written in different lines
 *
 * @param msgs
 * @returns An object containing the parsed messages.
 */
export function parseErrorMsg(msgs: string): CiaoDiagnostics {
  const warnings: CiaoDiagnosticInfo[] = [];
  const errors: CiaoDiagnosticInfo[] = [];
  const regexp =
    /{[^{}]*\b(WARNING|ERROR|Reading|In|Compiling|Checking|Loading)\b([^^]+)}/g;
  const w_regexp = /(Reading|In|Compiling|Checking|Loading)/g;
  msgs.match(regexp)?.forEach((e) => {
    let lines: string | undefined;
    let msg: string | undefined;
    if (e.match(/{SYNTAX (ERROR|WARNING)/)) return;
    if (e.match(w_regexp)) {
      e.split('\n')
        .filter((line) => line.includes('WARNING') || line.includes('ERROR'))
        .forEach((line) => {
          const errmsg = line.slice(line.indexOf(':') + 2);
          if (line.includes('lns')) {
            lines = errmsg.slice(errmsg.indexOf('(') + 5, errmsg.indexOf(')'));
            msg = errmsg.slice(errmsg.indexOf(')') + 2);
          } else {
            lines = undefined;
            msg = errmsg;
          }
          if (line.includes('WARNING')) {
            warnings.push({ lines, msg });
          } else if (line.includes('ERROR')) {
            errors.push({ lines, msg });
          } else {
            return;
          }
        });
    } else {
      const errmsg = e.slice(e.indexOf(':') + 2);
      if (e.includes('lns')) {
        lines = errmsg.slice(errmsg.indexOf('(') + 5, errmsg.indexOf(')'));
        msg = errmsg.slice(errmsg.indexOf(')') + 2, errmsg.indexOf('}') - 1);
      } else {
        lines = undefined;
        msg = errmsg.slice(0, errmsg.indexOf('}') - 1);
      }
      if (e.includes('WARNING')) {
        warnings.push({ lines, msg });
      } else if (e.includes('ERROR')) {
        errors.push({ lines, msg });
      }
    }
  });
  return { errors, warnings };
}
