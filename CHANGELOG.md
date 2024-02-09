# CHANGELOG

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-01-19

### Added

- Initial release of the extension.

## [0.1.1] - 2024-01-29

### Fixed

- Better support for OS detection

## [0.1.2] - 2024-02-01

### Fixed

- Warning message when running the extension in not supported OS's
- If the current top level is hidden, show it when loading or debugging the current file
- When the top level is started but hidden, when starting a top level, just show it. When the top level has finished, restart it.
- If the user has not saved a Ciao Prolog file when loading or debugging it, a warning message is prompted with the option to save them all before any action.
