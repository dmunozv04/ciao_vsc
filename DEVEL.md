# Development notes

This is the VSCode language extension for Ciao Prolog.

Useful links:

- VSCode Extension API: https://code.visualstudio.com/api

# Status

Language extension:

- [x] Syntax highlighting:
      Info: https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide

- [x] Snippet completion: `snippets.json`
      Info: https://code.visualstudio.com/api/language-extensions/snippet-guide

- [x] Language configuration: `language-configuration.json`
      Info: https://code.visualstudio.com/api/language-extensions/language-configuration-guide

  - [x] Bracket matching:
  - [x] Bracket autoclosing
  - [x] Bracket autosurrounding
  - [x] Comment toggling
  - [x] Folding (by markers)

Mark errors/warnings on source?

- [x] TBD

Toplevels:

- [x] Plain terminal? TBD

# Status (advanced)

Verifly?

- [x] Requires LSP? TBD (Adaptor based?)

Source debugger?

- [x] TBD

# Installing the Extension

1. Install dependencies:

   ```shell
   npm install
   ```

2. Package the extension:

   ```shell
   npm run package
   ```

   This command will bundle and package the extension in a `.vsix` file.

3. Insall the extension in VSCode:

   From VSCode go to **Extensions** and click on the three dot button in the explorer bar. Then click **install from _vsix_** and select the `.vsix` file located in the root of the project.

# Publishing the Extension

## VSCode Marketplace

1. Generate a personal access token in Dev Azure to publish an extension to the marketplace:

[Generate token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token).

2. Using `vsce`, login with `ciao-lang` publisher id:

   ```shell
   vsce login ciao-lang
   ```

   Provide the previously generated token when prompted so.

3. Using `vsce`, publish the extension:

   ```shell
   vsce publish
   ```

## OpenVSX Registry

1. Generate a personal access token in OpenVSX registry:

[Generate token](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions#3-create-an-access-token).

2. Package the extension:

   ```shell
   npm run package
   ```

3. Using `ovsx`, publish the `.vsix` file generated after packaging the extension:

   ```shell
   npx ovsx publish <file> -p <token>
   ```

# Bundling and installing the extension

(Only bundled extensions can be used in VS Code for Web environments
like github.dev and vscode.dev)

TBD
https://code.visualstudio.com/api/working-with-extensions/bundling-extension

# Automatic testing the extension

TBD
https://code.visualstudio.com/api/working-with-extensions/testing-extension

# Publishing the extension

TBD
https://code.visualstudio.com/api/working-with-extensions/publishing-extension

## Automated publishing from CI

TBD
https://code.visualstudio.com/api/working-with-extensions/continuous-integration
