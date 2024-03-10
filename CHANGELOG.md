# CHANGELOG

All notable changes to this project will be documented in this file.

## DRAFT: [0.1.6] - 2024-03-...

### Fixed

- Source Debugger in VSCode now counts the number of appearances of the predicates correctly.

## [0.1.5] - 2024-03-04

### Added

- Now it is possible to change the version of Ciao that VSCode uses to launch the Top Level.

## [0.1.3] - 2024-02-28

### Fixed

- Now predicates within a comment section are not taken into account when marking the debugger steps in the source code.
- Stdout from the cproc is now line buffered. Before, the content of the cproc was instantly displayed. Also, when 300ms have passed without receiving a newline character but there is data in stdout, it is flushed into the PTY.

## [0.1.2] - 2024-02-01

### Fixed

- Warning message when running the extension in not supported OS's
- If the current top level is hidden, show it when loading or debugging the current file
- When the top level is started but hidden, when starting a top level, just show it. When the top level has finished, restart it.
- If the user has not saved a Ciao Prolog file when loading or debugging it, a warning message is prompted with the option to save them all before any action.

## [0.1.1] - 2024-01-29

### Fixed

- Better support for OS detection

## [0.1.0] - 2024-01-19

### Added

- Initial release of the extension.




