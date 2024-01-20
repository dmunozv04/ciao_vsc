![Ciao Image](https://raw.githubusercontent.com/ciao-lang/ciao/master/core/doc/common/ciao-logo.png)

# Ciao Prolog Language Support for Visual Studio Code

This extension enhances Visual Studio Code with robust language support for **Ciao Prolog**, making it easier to write, edit, and debug **Ciao Prolog** code.

## Table of Contents

- [Installation (Windows)](#installation-windows)
- [Installation (Linux and macOS)](#installation-linux-and-macos)
- [Installing Dependencies](#installing-dependencies)
- [Installing Ciao Prolog](#installing-ciao-prolog)
- [Features](#features)
- [Usage](#usage)

## Installation (Windows)

To use this extension on Windows, follow these steps, which include setting up Windows Subsystem for Linux (WSL):

1. **Install Visual Studio Code.**

2. **Install the WSL extension:**

   - [Link to extension](vscode:extension/ms-vscode-remote.remote-wsl)

3. **Enable WSL:**

   - Open PowerShell as Administrator.
   - Run the following command:

     ```powershell
     Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
     ```

   - When the command finishes, you will need to restart Windows.

4. **Install a Linux distribution from the Microsoft Store:**

   - Ubuntu is a popular choice. Set up your Linux username and password during installation.

5. **Open Visual Studio Code within your Linux distribution in WSL:**

   - You can do this by launching WSL from the Start menu, then running `code .` from the Linux terminal.

After completing these steps, you can also use the extension in Visual Studio Code on your Windows system.

Note: For further instructions on how to setup a development environment in Windows using WSL and VSCode, check out the [official VSCode documentation](https://code.visualstudio.com/docs/remote/wsl) or the [official VSCode tutotial](https://code.visualstudio.com/docs/remote/wsl-tutorial).

## Installation (Linux and macOS)

On Linux and macOS, you can install this extension directly in Visual Studio Code without the need for additional setup.

1. **Open Visual Studio Code.**

2. **Go to the Extensions sidebar.**

3. **Search for "Ciao Prolog Language Support".**

4. **Click "Install".**

## Installing Dependencies

Before installing **Ciao Prolog** make sure you have all the dependencies required.

See [ciao dependencies](https://ciao-lang.org/ciao/build/doc/ciao.html/Install.html#Installing%20dependencies).

### Only for WSL Users

Make sure the utility `wslu` is installed in your system so you can get all the features. See [installing wslu](https://wslutiliti.es/wslu/install.html).

## Installing Ciao Prolog

### Visual Studio Code

If **Ciao Prolog** is not installed in your system, follow these steps to install it from Visual Studio Code:

1. **Open Visual Studio Code.**

2. **Create or open a Ciao Prolog file** anywhere on your system (example: `foo.pl`).

3. You will be prompted an information message asking if you want to install it. **Click "Install".**

4. Follow the **installation** steps.

5. Once the installer finishes, **restart Visual Studio Code** to apply the changes.

#### Other alternatives

Access the official [Ciao Prolog Installation Guide](https://ciao-lang.org/install.html) and follow the steps.

## Features

## Commands
 * **Open Top Level**: Opens a Ciao Top Level (minor version) with the pwd set to the current folder in the editor.

## Useful Links
 * [Ciao Installation](https://ciao-lang.org/install.html)
 * [Ciao Documentation](https://ciao-lang.org/ciao/build/doc/ciao.html/)
 * [Ciao GitHub Repository](https://github.com/ciao-lang/ciao)
