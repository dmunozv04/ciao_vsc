'use strict';

import * as path from 'node:path';
import {
  commands,
  extensions,
  languages,
  workspace,
  window,
  DiagnosticCollection,
  ExtensionContext,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { CiaoFileKind, CiaoTopLevelKind } from '../../shared/types';
import {
  ciaoNotInstalled,
  isCiaoInstalled,
  openBrowserTab,
  promptCiaoInstallation,
  getOS,
  setOS,
} from './utils';
import {
  getActiveCiaoFileKind,
  getActiveCiaoFileName,
  getActiveCiaoFilePath,
} from './ciaoUtils/ciaoFile';
import { createPlaygroundURL } from './ciaoUtils/ciaoPlayground';
import { CiaoTopLevel, getTopLevel } from './ciaoUtils/ciaoTopLevel';
import { disableSyntaxTheme, selectSyntaxTheme } from './commands/ciaoSyntax';
import { genDoc, previewDoc, showDoc } from './commands/lpdoc';
import { initGlobalStorage } from './contextManager';

export let diagnosticCollection: DiagnosticCollection;
let ciaoTopLevel: CiaoTopLevel;
let client: LanguageClient;

export async function activate(context: ExtensionContext): Promise<void> {
  // Initialize the global storage
  initGlobalStorage(context);

  // Store in the global storage user's OS
  setOS();

  // If user's using this extension in other OS, prompt alert and redirect to installation guide
  if (getOS() === 'unknown') {
    const options = ['Installation Guide', 'Dismiss'];
    const selection = await window.showWarningMessage(
      'The Ciao Prolog Language Extension can only run in Linux, macOS or WSL. Please follow the installation instructions.',
      ...options
    );

    if (selection === 'Installation Guide') {
      openBrowserTab(
        'https://marketplace.visualstudio.com/items?itemName=ciao-lang.ciao-prolog-vsc&ssr=false#user-content-installation-(windows)'
      );
    } else {
      window.showWarningMessage(
        'The extension will not work in this operative system'
      );
    }
    return;
  }

  // Prompting the Ciao Installer if it is not installed
  if (!isCiaoInstalled()) {
    ciaoNotInstalled();
  }

  // Creating the diagnostics collection
  diagnosticCollection = languages.createDiagnosticCollection('ciao');

  // Add it to the disposables
  context.subscriptions.push(diagnosticCollection);

  // Prompts Ciao installer
  context.subscriptions.push(
    commands.registerCommand(
      'ciao.promptCiaoInstallation',
      promptCiaoInstallation
    )
  );

  // Select a syntax theme
  context.subscriptions.push(
    commands.registerCommand('ciao.selectSyntaxTheme', selectSyntaxTheme)
  );

  // Disable the syntax theme
  context.subscriptions.push(
    commands.registerCommand('ciao.disableSyntaxTheme', disableSyntaxTheme)
  );

  // Start a Ciao Top Level
  context.subscriptions.push(
    commands.registerCommand('ciao.startCiaoTopLevel', () =>
      startTopLevel(CiaoTopLevelKind.TopLevel)
    )
  );

  // Start a CiaoPP Top Level
  context.subscriptions.push(
    commands.registerCommand('ciao.startCiaoPPTopLevel', () =>
      startTopLevel(CiaoTopLevelKind.CiaoPP)
    )
  );

  // Start a LPdoc Top Level
  // Not functioning until the stable build includes shell args in the LPdoc Top Level
  context.subscriptions.push(
    commands.registerCommand('ciao.startLPdocTopLevel', () =>
      startTopLevel(CiaoTopLevelKind.LPdoc)
    )
  );

  // Load module in Ciao Top Level
  context.subscriptions.push(
    commands.registerCommand('ciao.loadModule', async () => {
      const filePath = getActiveCiaoFilePath();
      const fileKind = getActiveCiaoFileKind();

      await startTopLevelIfNotStarted(CiaoTopLevelKind.TopLevel);
      ciaoTopLevel.show();
      await sendQuery(
        fileKind === CiaoFileKind.User
          ? `ensure_loaded('${filePath}').`
          : `use_module('${filePath}').`
      );
    })
  );

  // Debug module in Ciao Top Level
  context.subscriptions.push(
    commands.registerCommand('ciao.debugModule', async () => {
      const filePath = getActiveCiaoFilePath();
      const fileNameWithoutExt = getActiveCiaoFileName(false);
      const fileKind = getActiveCiaoFileKind();

      await startTopLevelIfNotStarted(CiaoTopLevelKind.TopLevel);
      ciaoTopLevel.show();
      await sendQuery('display_debugged.');
      await sendQuery(
        `debug_module_source(${
          fileKind === CiaoFileKind.User ? 'user' : fileNameWithoutExt
        }).`
      );
      await sendQuery('trace.');
      await sendQuery(
        fileKind === CiaoFileKind.User
          ? `ensure_loaded('${filePath}').`
          : `use_module('${filePath}').`
      );
    })
  );

  // Run tests in current module
  context.subscriptions.push(
    commands.registerCommand('ciao.runTests', async () => {
      const filePath = getActiveCiaoFilePath();

      await startTopLevelIfNotStarted(CiaoTopLevelKind.TopLevel);
      ciaoTopLevel.show();
      await sendQuery(`use_module(library(unittest)).`);
      await sendQuery(`run_tests_in_module('${filePath}').`);
    })
  );

  // Run tests and check export assertions in current module
  context.subscriptions.push(
    commands.registerCommand('ciao.runTestsAssrts', async () => {
      const filePath = getActiveCiaoFilePath();

      await startTopLevelIfNotStarted(CiaoTopLevelKind.TopLevel);
      ciaoTopLevel.show();
      await sendQuery(`use_module(library(unittest)).`);
      await sendQuery(`run_tests_in_module_check_exp_assrts('${filePath}').`);
    })
  );

  // Generate documentation for file
  context.subscriptions.push(commands.registerCommand('ciao.genDoc', genDoc));

  // Display documentation for file
  context.subscriptions.push(commands.registerCommand('ciao.showDoc', showDoc));

  // Genarate and display preview documentation for file
  context.subscriptions.push(
    commands.registerCommand('ciao.previewDoc', previewDoc)
  );

  // Open file in Ciao Playground
  context.subscriptions.push(
    commands.registerCommand('ciao.openInCiaoPG', () => {
      const url: string | undefined = createPlaygroundURL();
      if (!url) return;
      openBrowserTab(url);
    })
  );

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('out', 'server', 'src', 'server.js')
  );

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for ciao text documents
    documentSelector: [{ scheme: 'file', language: 'ciao' }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'languageServerExample',
    'Language Server Example',
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

async function startTopLevel(kind: CiaoTopLevelKind): Promise<void> {
  if (getTopLevel(kind)) {
    if (ciaoTopLevel.isRunning()) {
      ciaoTopLevel.show();
      return;
    }
    ciaoTopLevel?.dispose();
  }
  ciaoTopLevel = await new CiaoTopLevel(kind).start();
  // TODO: When executing a command with no Ciao Top Level started
  // the command is sent before every process is setted up.
  await new Promise((resolve) => setTimeout(() => resolve(undefined), 750));
}

async function sendQuery(cmd: string): Promise<string | undefined> {
  return await ciaoTopLevel?.sendQuery(cmd);
}

function isCiaoTopLevelStarted(kind: CiaoTopLevelKind): boolean {
  return !!getTopLevel(kind);
}

async function startTopLevelIfNotStarted(
  kind: CiaoTopLevelKind
): Promise<void> {
  if (!isCiaoTopLevelStarted(kind)) {
    await startTopLevel(kind);
  }
}
