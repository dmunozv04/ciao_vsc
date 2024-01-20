'use strict';

import { sep, basename } from 'node:path';
import {
  Diagnostic,
  DiagnosticSeverity,
  window,
  TextEditor,
  Range,
  TextDocument,
  Position,
  TextEditorRevealType,
} from 'vscode';
import type {
  CiaoDiagnosticInfo,
  CiaoDiagnostics,
  DebugMark,
  CiaoToken,
} from '../../../shared/types';
import { CiaoFileKind } from '../../../shared/types';
import { debuggerDecorationAtom, debuggerDecorationType } from '../constants';
import { diagnosticCollection } from '../extension';
import { ciaoTokenize } from './ciaoTokenize';

function getActiveCiaoFile(): TextDocument | undefined {
  const textEditor: TextEditor | undefined = window.activeTextEditor;
  if (!textEditor || !textEditor.document.fileName.endsWith('.pl')) {
    return;
  }
  return textEditor.document;
}

/**
 * @param range Specifies the region of the document to read.
 * @returns The whole file content or a chunk if specified.
 */
export function getActiveCiaoFileContent(range?: Range): string | undefined {
  return getActiveCiaoFile()?.getText(range);
}

/**
 * Translates a WSL path to the real path in the Linux distro.
 * When trying to translate a Linux path, it returns it without modification.
 * @param path Path to translate
 * @returns The translated path
 */
export function translatePath(path: string): string {
  const dirs = path.split(sep);
  if (!dirs[0].endsWith(':')) return path;
  // Translate the PATH
  dirs[0] = `/mnt/${dirs[0].slice(0, dirs[0].length - 1)}`;
  return dirs.join(sep);
}

/**
 * @returns The full path of the active **Ciao Prolog** file.
 *
 * If the path is a _WSL_ path, it is translated into a Unix-Like path
 */
export function getActiveCiaoFilePath(): string | undefined {
  const path = getActiveCiaoFile()?.fileName;
  if (!path) return;
  return translatePath(path);
}

/**
 * @param [extension=true] When set to **false** returns the fileName without the extension. Default **true**
 * @returns The name of the active **Ciao Prolog** file.
 */
export function getActiveCiaoFileName(extension = true): string | undefined {
  const filePath = getActiveCiaoFilePath();
  if (filePath === undefined) return;
  return extension ? basename(filePath) : basename(filePath, '.pl');
}

/**
 * @returns The kind of the active **Ciao Prolog** file.
 */
export function getActiveCiaoFileKind(): CiaoFileKind | undefined {
  const content = getActiveCiaoFileContent(
    new Range(new Position(0, 0), new Position(20000, 0))
  );
  if (!content) return;
  if (content.match(/[^\t]*:-[\t\n\s]*(module|class)[\t\n\s]*/) !== null) {
    return CiaoFileKind.Normal;
  }
  return CiaoFileKind.User;
}

/**
 * Sets decorators (warnings and errors) in the active **Ciao Prolog** file
 * deleting previous decorators (if any).
 * @param msgs
 */
export function markErrorsOnCiaoSource(msgs: CiaoDiagnostics): void {
  const document = getActiveCiaoFile();
  // No Ciao Document?
  if (!document) return;
  const uri = document.uri;
  // Helper function to obtain the Range of the decoration
  const getRange = (lines: string): Range => {
    const [start, end] = lines.split('-');
    return new Range(
      document.lineAt(Number(start) - 1).range.start,
      document.lineAt(Number(end) - 1).range.end
    );
  };
  // Helper function to create the diagnostics
  const createDiagnostics = ({
    msgs,
    severity,
  }: {
    msgs: CiaoDiagnosticInfo[];
    severity: DiagnosticSeverity;
  }): Diagnostic[] => {
    return msgs.flatMap((msg: CiaoDiagnosticInfo) => {
      if (!msg.lines) return [];
      return new Diagnostic(getRange(msg.lines), msg.msg ?? '', severity);
    });
  };
  // Clearing previous marks
  diagnosticCollection.clear();
  // Creating diagnostics
  const errors: Diagnostic[] = createDiagnostics({
    // Only create diagnostics for messages that have lines associated
    msgs: msgs.errors.filter((error) => !!error.lines),
    severity: DiagnosticSeverity.Error,
  });
  const warnings: Diagnostic[] = createDiagnostics({
    // Only create diagnostics for messages that have lines associated
    msgs: msgs.warnings.filter((warning) => !!warning.lines),
    severity: DiagnosticSeverity.Warning,
  });
  // Diagnostics collection
  diagnosticCollection.set(uri, [...errors, ...warnings]);
}

/**
 * Sets the current debugger mark in source.
 * @param param0 Object containing the parsed info of the debug mark.
 */
export function markDbgMarksOnCiaoSource({
  srcFile,
  startLine,
  endLine,
  predName,
  nthPred,
}: DebugMark): void {
  const activeEditor = window.activeTextEditor;
  // Check if the active editor is not the same as the file being debugged
  if (activeEditor?.document.fileName !== srcFile) return;
  // Creating Range
  const range = new Range(
    activeEditor.document.lineAt(startLine).range.start,
    activeEditor.document.lineAt(endLine).range.end
  );
  // Get the chunk of code from source to parse
  const code: string | undefined = getActiveCiaoFileContent(range);
  // Check if there's code
  if (!code) return;
  // Tokenize the chunk of code
  const tokens: CiaoToken[] = ciaoTokenize(code);
  // Search the line of the nth predName
  let count = 0;
  let predLine = -1;
  let row = -1;
  for (let i = 0; i < tokens.length; ++i) {
    // Found an atom with the same name
    if (tokens[i].kind === 'atom' && tokens[i].text === predName) {
      count++;
      if (count === nthPred) {
        row = tokens[i].position.row;
        predLine = startLine + tokens[i].position.line;
        console.log({ predLine, row });
        break;
      }
    }
  }
  // Check if the line was found
  if (predLine === -1 || row === -1) return;
  // Create one line range
  const lineToMark = new Range(
    activeEditor.document.lineAt(predLine).range.start,
    activeEditor.document.lineAt(predLine).range.end
  );
  const atomToMark = new Range(
    new Position(predLine, row),
    new Position(predLine, row + predName.length)
  );
  // Mark the line on source
  activeEditor.setDecorations(debuggerDecorationType, [lineToMark]);
  // Mark the specific atom on source
  activeEditor.setDecorations(debuggerDecorationAtom, [atomToMark]);
  // Focus the line at the center of the source file
  activeEditor.revealRange(lineToMark, TextEditorRevealType.InCenter);
}
