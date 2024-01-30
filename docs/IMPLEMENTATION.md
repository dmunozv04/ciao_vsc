# Implementation Details

## Language Extension

### Requirements

This extension is design to work with the stable versions of **Ciao Prolog** which are available for _Linux_ and _MacOS_. For _**Windows**_ support, it is required to have a _**Windows Subsystem for Linux**_ (WSL) configured and integrated with _VSCode_. This is the **official documentation** on how to set up a development enviroment in _**Windows**_ using WSL and _VSCode_:

https://code.visualstudio.com/docs/remote/wsl

### Installing Ciao Language

The extension offers the option of installing **Ciao Prolog** from within the VSCode tab if it is not installed when the extension is activated (the extension activates whenever a `.pl` file is opened in the workspace).

If the extension detects that the command `ciao` is not in the `PATH`, it will prompt a message asking the user if he wants to install the language. If accepted, it will open a terminal tab with the **Ciao** installer so the user can follow the steps or simply make de default installation.

### Syntax Highlighting

The syntax rules in VSCode are defined as [TextMate Grammars](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide), which is basically a collection of _REGEXs_ that are applied to a **Ciao Prolog** file. If a pattern matches with any of the _REGEXs_, a token is defined. After all the tokens are defined in the current file, the active color theme in VSCode associates a color to a token.

To provide a experience as close as the Emacs mode, the user has the option to override the color rules of the current color theme with the _official_ **Ciao Prolog** syntax coloring rules using a certain command. This feature can only be accomplished by inserting a series of TextMate rules in the `settings.json` file of the user.

### Snippet Completion

The extension provides a set of predefined code snippets to insert common code structures in **Ciao Prolog** files.

### Language Configuration

A set of miscelaneous language configuration features.

1. **Bracket matching**

2. **Bracket autoclosing**

3. **Comment toggling**

4. **Auto indentation**

   - This feature is still in development and it provides very basic indentation rules.

5. **Folding by markers**

   ```prolog
   %# region ...
   %# endregion
   ```

### Ciao Top Level

The extension implements an integrated **Ciao Top Level** within the VSCode window. The first approach to this feature was simply opening an integrated terminal running a `ciaosh` process. However, when implementing more advanced features that depended on the **Ciao Top Level** this solution was not enough.

The next approach was creating a Pseudoterminal (PTY) interface connected to an underneath `ciaosh` process. Despite being a more complex task than simply launching a terminal, it provided much more control over the **Ciao Top Level** (stdout, syntax coloring, multiple line queries...).

The implementation has the following structure:

![ciao top level design](https://raw.githubusercontent.com/ciao-lang/ciao_vsc/master/docs/images/design.png)

It is promise based so the order of execution of commands is always in the order specified.

The PTY can receive input from the user (keyboard) and programatically (VSCode commands). This input is processed and sent as a query to the underlying `ciaosh` process. Once the query is resolved, the process displays the result in the PTY. Additionally, every query is stored in a command ring so the user can access the previous commands.

The PTY also implements the most common terminal keybindings:

- `Ctrl + L` . Clears the screen.
- `Ctrl + A` . Places the cursor at the beginning of the line.
- `Ctrl + E` . Places the cursor at the end of the line.
- `Ctrl + K` . Deletes the characters from the cursor to the end of the line.
- `Ctrl + W` . Deletes words backwards.

_Note: It is also possible to open both the **CiaoPP** and **LPDoc Top Levels** using this interface._

### Sending commands to the Top Level

As mentioned before, it is possible to send commands to an existing **Ciao Top Level** by running the commands available in the _Command Palette_. Some of the commands available are:

- `CiaoSys: (Re)Start Ciao top level`

  - Restarts the **Ciao Top Level** if it is running. If not, it starts it.

- `CiaoSys: (Re)Load file into top level`

  - Loads the active **Ciao Prolog** file into the top level.

- `CiaoDbg: Run tests in current module`

  - Runs the collection of tests in the active **Ciao Prolog** file into the top level.

- `LPdoc: Generate and view documentation preview for file`
  - Generates and previews the **LPdoc** documentation of the active **Ciao Prolog** file.

<br/>

However this feature is totally extensible, so in the future there will be available a lot more of commands.

_Note: All the commands that depend on the **Ciao Top Level** will start it if it is not running._

### Marking errors on source

Whenever the user loads a module into the **Ciao Top Level**, if there are any errors during the compilation, they will be sent as diagnostics marked in the source code in two different colors:

- **Warnings**: Displayed with a yellow wavy underline.

- **Errors**: Displayed with a red wavy underline.

This diagnostics are also registered in the **Problems** tab in the VSCode window. They provide a brief explanation of the error.

<br/>

### Generating and displaying documentation

Another key feature of the extension is generating and displaying documentation using **LPdoc**, the doc. generator bundle for **Ciao Prolog**. By using commands, the user can generate and access a preliminar version of the documentation in a temporary directory so it does not mess up the working directory. If the user is satisfied with the results, it is possible to generate the documentation in the current working directory using another command.

_Note: These features are implemented by spawning `lpdoc` commands with certain arguments. In the future, these tasks will be performed by the **LPdoc Top Level** so the user can interact with the process of generating the documentation._

### Opening the current file in the Ciao Playground in a web browser tab

With just a simple command, it is possible to open the current **Ciao Prolog** file in a **Ciao Playground** tab so it is possible to edit and share the code in a more convenient way.

The files can not exceed the maximum _URL_ length of the browsers (2048 in the worst case). So when the user tries to load a file that is too big, the extension will show an error message indicating that it exceeds the maximum length.

### Source debugger

When debugging a **Ciao Prolog** file, every step that the debugger takes is marked and focused in the source file with a blue line and a blue rectangle on the predicate so the user can clearly see where the debugger is in every moment.

### Verifly

**_On-the-fly_** checking fully customizable.
