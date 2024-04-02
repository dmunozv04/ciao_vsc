'use strict';

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type {
  CiaoDiagnosticInfo,
  CiaoDiagnostics,
  CiaoChecker,
} from '../../shared/types';
import { parseErrorMsg } from '../../shared/ciaoParse';
import { flycheckSuffix, getCiaoChecker } from './utils/ciaoCheckerConstants';

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Timer to wait for the user to stop typing
let compileTimer: NodeJS.Timeout | undefined;

connection.onInitialize(() => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
    },
  };
  return result;
});

documents.onDidChangeContent((change) => {
  // If the user opens a tmp file, do not check it
  if (
    path.basename(fileURLToPath(change.document.uri)).includes(flycheckSuffix)
  ) {
    return;
  }
  // Minidelay so it starts when the user stops typing
  clearTimeout(compileTimer);
  compileTimer = setTimeout(() => {
    validateTextDocument(change.document);
  }, 200);
});

function createDiagnostics(
  msgs: CiaoDiagnosticInfo[],
  severity: DiagnosticSeverity
): Diagnostic[] {
  return msgs.map(({ lines, msg }) => {
    // If the lines are not specified, hardcode it to the top of the file
    const [startLine, endLine] = lines ? lines.split('-') : ['1', '1'];

    const diagnostic: Diagnostic = {
      severity,
      message: msg ?? '',
      range: {
        start: {
          line: Number(startLine) - 1,
          character: 0,
        },
        end: {
          line: Number(endLine) - 1,
          character: 20_000,
        },
      },
    };

    return diagnostic;
  });
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const { dir, ext, name } = path.parse(fileURLToPath(textDocument.uri));

  const tmpFilePath = `${dir}/${name}${flycheckSuffix}${ext}`;

  const checker: CiaoChecker | undefined = await getCiaoChecker(
    connection,
    tmpFilePath
  );

  if (!checker) {
    return;
  }

  writeFileSync(tmpFilePath, textDocument.getText());

  const { stderr } = spawnSync(checker.executable, checker.args);

  // Parse messages
  const { errors, warnings }: CiaoDiagnostics = parseErrorMsg(String(stderr));

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({
    uri: textDocument.uri,
    diagnostics: [
      ...createDiagnostics(errors, DiagnosticSeverity.Error),
      ...createDiagnostics(warnings, DiagnosticSeverity.Warning),
    ],
  });
}

connection.onDidChangeWatchedFiles(() => {});

documents.listen(connection);

connection.listen();
