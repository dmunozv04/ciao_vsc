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

1. **Install WSL**

   - Open **PowerShell** as an _**administrator**_.
   - Run the following command:

   ```powershell
   $ wsl --install
   ```

   - Restart the PC if necessary.

2. **Open Visual Studio Code within your Linux distribution in WSL:**

   - You can do this by launching WSL from the Start menu, then running `code .` from the Linux terminal.

3. **Install the WSL extension:**

   - [Link to extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl).

4. **Open a WSL terminal and install WSL Utilities:**

   ```bash
   $ sudo add-apt-repository ppa:wslutilities/wslu
   $ sudo apt update
   $ sudo apt install wslu
   ```

5. **Create a Ciao Prolog project:**

   ```bash
   $ mkdir prode && touch ./prode/code.pl
   ```

6. **Open Visual Studio Code in the recently created project:**

   ```bash
   $ code prode
   ```

7. **Install the Advanced Ciao Prolog extension:**

   - [Link to extension](https://marketplace.visualstudio.com/items?itemName=ciao-lang.ciao-prolog-vsc)

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

### Syntax Highlighting

The extension provides comprehensive syntax highlighting for **Ciao Prolog**. It also offers the ability to override color rules with official **Ciao Prolog** syntax coloring rules using a certain command. For more information on customizing syntax highlighting, see [customizing syntax highlighting](#customizing-syntax-highlighting).

### Snippet Completion

The extension includes a collection of predefined code snippets to help users insert common code structures in **Ciao Prolog** files. This feature speeds up coding by allowing users to quickly insert templates for common patterns.

### Language Configuration

The extension includes various language configuration features for enhanced editing and coding experiences:

1. **Bracket Autoclosing:** It automatically closes brackets as you type to reduce errors.

2. **Comment Toggling:** Quickly toggle comments on or off in your code.

3. **Folding by Markers:** It allows you to fold sections of your code between markers.

```prolog
%# region ...

% Your code goes here

%# endregion
```

4. **Auto Indentation (experimental):** Although this feature is in development, it provides basic indentation rules to help format your code consistently.

### Ciao Top Level

The extension introduces an integrated **Ciao Top Level** within the Visual Studio Code window. It allows you to interact with the **Ciao Prolog** interpreter, providing advanced features and control, including syntax coloring, debugging, and more.

### Sending Commands to the Top Level

Users can send the most useful commands to the **Ciao Top Level** by clicking on a series of special buttons that are available when focused on a **Ciao Prolog** file.

![special buttons for ciao prolog files](https://raw.githubusercontent.com/ciao-lang/ciao_vsc/master/public/images/buttons.jpg)

1. **_Play_**: Loads the current module in the **Ciao Top Level**.

2. **_Ciao Icon_**: Opens a new **Ciao Top Level** or restarts an existing one.

3. **_Debug_**: Activates the debugger for the current module in the **Ciao Top Level**.

4. **_LPdoc Icon_**: Generates and displays a documentation preview of the current module.

5. **_Share_**: Opens a **Ciao Playground** tab containing contents of the current module.

_Note: All this buttons are associated with its corresponding command that is also available using the Visual Studio Code Command Palette_

Also, there exist many other commands that are not available via buttons and must be used by invoking commands available in the Visual Studio Code Command Palette. Some of the available commands include:

- `CiaoDbg: Run tests in current module`
- `LPdoc: Generate documentation for file`

For a quick guide to interact with the Visual Studio Code Command Palette, see [working with the command palette](#working-with-the-command-palette)

For a complete list of the **Ciao Top Level commands**, please check out the `Contributes: Commands` section in the marketplace.

### Marking Errors on Source

When you load a module into the **Ciao Top Level**, the extension automatically marks errors detected in the process. Warnings are displayed with a yellow wavy underline, and errors are displayed with a red wavy underline.

These diagnostics also include a brief explanation of the problem that was found.

### Verifly

This VSCode extension enhances your coding experience by providing real-time verification and/or linting as you type **Ciao Prolog Code**. Which will help you find possible errors and warnings as you are coding!

See [configure verifly](#configuring-verifly).

### Generating and Displaying Documentation

The extension supports generating and displaying documentation using LPdoc, the documentation generator for **Ciao Prolog**. Users can generate and access preliminary documentation in a temporary directory before deciding to generate it in the current working directory.

### Opening the Current File in the Ciao Playground

With a simple command, you can open the current **Ciao Prolog** file in a **Ciao Playground** tab in your web browser. This feature allows for convenient editing and sharing of code. Please note that there is a maximum URL length (2048 in the worst case), and files exceeding this length will show an error message. For details on using this feature.

### Source Debugger

When debugging a **Ciao Prolog** file, every step taken by the debugger is marked with a blue line in the source code. This visual indication helps users track the debugger's progress and location. For more on using the source debugger.

These features make the **Ciao Prolog Language Support** extension a powerful tool for developing **Ciao Prolog** applications in Visual Studio Code. To learn more about each feature, refer to the respective sections linked above.

## Usage

### Working with the Command Palette

The natural and more convenient way to work with this extension is by using the Visual Studio Code command palette.

To access the Command Palette in Visual Studio Code and select extension commands, follow these simple steps:

1. **Open the Command Palette:** There are several ways to open the Command Palette:

   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) keyboard shortcut.
   - Click on the "View" menu in the top toolbar and select "Command Palette."

2. **Type Command:** In the Command Palette, start typing the name or keyword related to the command you want to execute. As you type, a list of matching commands will appear in the dropdown.

3. **Select Command:** Once you see the desired command in the list, use the arrow keys or your mouse to highlight it, and then press `Enter` to select and execute the command.

This simple process allows you to quickly access and use the various commands provided by the **Ciao Prolog Language Support** extension within Visual Studio Code.

### Customizing Syntax Highlighting

By default, the syntax coloring of **Ciao Prolog** Files follow the coloring rules of the current Visual Studio Code editor theme.

However, if you want to use the official **Ciao Prolog** coloring rules, you can activate them by following these steps:

1. **Execute the command:** `Ciao: Select syntax theme`

2. **Select** the `Dark` or `Light` theme depending on your current theme.

In case you want to disable them, just execute the command:

`Ciao: Disable syntax theme`

### Configuring _Verifly_

By default, **_verifly_** comes deactivated. You can activate it through Visual Studio Code Configuration as follows:

1. Search for **Ciao Prolog** in the Visual Studio Code Configuration.

2. **Select any of these options:**

   - `off`: Disables on-the-fly checking and syntax errors are only marked when the file is loaded into the **Ciao Top Level**.

   - `ciaoc`: Enables on-the-fly syntax checking while typing.

   - `ciaopp`: Enables on-the-fly verification.

   - `ciao-test`: Enables on-the-fly syntax checking and test-running while typing.

   - `lpdoc`: Enables on-the-fly syntax checking for lpdoc files.
