'use strict';

export enum CiaoFileKind {
  User,
  Normal,
}

export enum CiaoTopLevelKind {
  TopLevel,
  LPdoc,
  CiaoPP,
}

export type OS = 'darwin' | 'linux' | 'wsl' | 'unknown';

export type CiaoDiagnosticInfo = {
  lines: string | undefined;
  msg: string | undefined;
};

export type CiaoDiagnostics = {
  errors: CiaoDiagnosticInfo[];
  warnings: CiaoDiagnosticInfo[];
};

export type DebugMark = {
  srcFile: string;
  startLine: number;
  endLine: number;
  predName: string;
  nthPred: number;
};

export type CiaoToken = {
  kind: string;
  text: string;
  position: { line: number; row: number };
};

export type CiaoRule = {
  name: string;
  scope: string[] | string;
  settings: object;
};

export type CiaoChecker = {
  executable: string;
  args: string[];
};

export type EditorSettings = {
  textMateRules?: CiaoRule[];
};

export type Resolver = ((value: string | PromiseLike<string>) => void) | null;

export type OutputCallback = (output: string) => void;

export type CiaoUserConfiguration = 'off' | 'ciaopp' | 'ciao-test' | 'lpdoc';
