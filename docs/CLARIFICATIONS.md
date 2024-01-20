# Clarifications and notes about development

### Syntax highlighting Ciao Prolog files

The goal of this feature is to make the syntax as similar as possible to the one defined in Emacs. Nowadays, to customize the tokens' colors and font type, according to [2023 VSCode documentation on Configuration Scopes](https://code.visualstudio.com/docs/getstarted/settings), is user or workbench scope.

This means that this feature can only be achieved by inserting a new value for the `editor.tokenColorCustomizations` key in `settings.json` (see more in [editor syntax highlight](https://code.visualstudio.com/docs/getstarted/themes#_editor-syntax-highlighting)). This would be automatically added when installing the extension, and it will merge with the previous configurations the user may have done before.

### CiaoPP and LPdoc TopLevels

After implementing a PTY for the Ciao Top Level, I tried to extend it for CiaoPP and LPdoc Top Levels also. The problem I encountered is that, while in the CiaoTL I could determine when a message from the TL has concluded because the prompt (?- ) is printed in the stdout; when using the other two TLs, for some reason the prompt just doesn't get captured in the stdout, which is weird.

**SOLUTION**: This was fixed by including the -i flag for the CiaoPP and LPdoc toplevels to force interactive mode.

### Parser Ciao Playground

When reusing the already implemented parser function in the playground, I found a bug when treating with assertion comments. Let's see this example:

```
{Reading foo.pl
ERROR: (lns 135-140) syntax error: operator expected after expression
cell( Pos , Op ) :- pos( _ , _ ) = Pos , op( _ , _ ) = Op
** here **
:- prop dir( Dir , Num ) # "@var{Dir} is one of the directions admitted and @var{Num} is the number of moves available in that direction. @includedef{dir/2}" .
}
```

When this error is parsed, the REGEX captures everything between curly braces. However, if the next line of the error contains an assertion comment including `@...{...}` notation, the parser matches the opening curly brace and it doesn't return any error message.

**SOLUTION**: Instead of capturing any character except for curly braces, a new (more restrictive) rule captures any character except for curly braces **at the beggining of the line**. This solution is not perfect, it cannot handle `@...{...}` notation written in multiple lines:

```prolog
@var{
  Dir
}
```
