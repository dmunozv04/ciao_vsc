'use strict';

import { _Connection } from 'vscode-languageserver';
import type { CiaoUserConfiguration, CiaoChecker } from '../../../shared/types';

export const flycheckSuffix = '_flycheck_tmp_co';

export const getCiaoChecker = async (
  connection: _Connection,
  filePath: string
): Promise<CiaoChecker | undefined> => {
  const ciaoCheckerTable = {
    off: undefined,
    ciaopp: {
      executable: 'ciaopp',
      args: ['-op', flycheckSuffix, '-V', filePath],
    },
    lpdoc: {
      executable: 'lpdoc',
      args: ['-t', 'nil', '-op', flycheckSuffix, filePath],
    },
    ciaoc: {
      executable: 'ciaoc',
      args: ['-c', '-op', flycheckSuffix, filePath],
    },
    'ciao-test': {
      executable: 'ciaosh',
      args: [
        '-e',
        'use_module(library(unittest), [run_tests_in_module/1])',
        '-e',
        'use_module(library(compiler/c_itf),[opt_suffix/2])',
        '-e',
        `opt_suffix(_, '${flycheckSuffix}')`,
        '-e',
        `run_tests_in_module('${filePath}')`,
        '-e',
        'halt',
      ],
    },
  };
  const userConfiguration = <CiaoUserConfiguration>(
    await connection.workspace.getConfiguration('ciao.checker')
  );

  return ciaoCheckerTable[userConfiguration];
};
