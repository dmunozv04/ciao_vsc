/* eslint-disable */
export var ciaoTokenize = (function() {
  // JavaScript translation of the Ciao Prolog's tokenizer.pl (and
  // some definitions from the Ciao engine).  --Jose F. Morales
  //
  // The original code was written or modified by several people
  // (Daniel Cabeza, Manuel Carro, D.H.D.Warren, Richard O'Keefe, Mats
  // Carlsson, Manuel Hermenegildo, Jose F. Morales)

  // Character table (8-bits)
  var chartbl = [];
  function code_class(x) {
    if (x === '') {
      // end of file
      return -1;
    } else {
      x = ord(x);
      if (x >= 0 && x < 255) {
        return chartbl[x];
      } else {
        return 0;
      }
    }
  }

  // Character classes
  // -1 - end of file
  //  0 - layout
  //  1 - small letter
  //  2 - capital letter (including '_')
  //  3 - digit
  //  4 - graphic
  //  5 - punctuation
  function init_chartbl() {
    function inittbl(lst, val) {
      for (let i = 0; i < lst.length; i++) {
        chartbl[ord(lst[i])] = val;
      }
    }
    // default: whitespace
    for (let i = 0; i < 128; i++) {
      chartbl[i] = 0;
    }
    // accept 128..255 as lowercase
    for (let i = 128; i < 256; i++) {
      chartbl[i] = 1;
    }
    // lowercase
    inittbl('abcdefghijklmnopqrstuvwxyz', 1);
    // uppercase
    inittbl('ABCDEFGHIJKLMNOPQRSTUVWXYZ_', 2);
    // digits
    inittbl('0123456789', 3);
    // symbolchars
    inittbl('#$&*+-./:<=>?@^\\`~', 4);
    // punctuation
    inittbl('!;"\'%(),[]{|}', 5);
  }

  init_chartbl();

  function is_whitespace(x) {
    return code_class(x) == 0;
  }
  function is_lower_char(x) {
    return code_class(x) == 1;
  }
  function is_upper_char(x) {
    return code_class(x) == 2;
  }
  function is_digit_char(x) {
    return code_class(x) == 3;
  }
  function is_symbol_char(x) {
    return code_class(x) == 4;
  }
  // Letters, digits, and underscores
  function is_alphanum_char(x) {
    var c = code_class(x);
    return c == 1 || c == 2 || c == 3;
  }

  function ord(str) {
    return str.charCodeAt(0);
  }

  function custom_digit(base, x) {
    if (base == 8) {
      return ord(x) >= ord('0') && ord(x) <= ord('7');
    } else if (base == 16) {
      return (
        is_digit_char(x) ||
        (ord(x) >= ord('a') && x <= ord('f')) ||
        (x >= ord('A') && x <= ord('F'))
      );
    } else {
      throw new InternalError(`bad base ${base}`);
    }
  }

  function custom_digit_value(base, x) {
    // precondition: custom_digit(base, x)
    if (base == 8) {
      return ord(x) - ord('0');
    } else if (base == 16) {
      if (ord(x) >= ord('a') && ord(x) <= ord('f')) {
        return ord(x) - ord('a');
      } else if (ord(x) >= ord('A') && ord(x) <= ord('F')) {
        return ord(x) - ord('A');
      } else if (x >= ord('0') && ord(x) <= ord('9')) {
        return ord(x) - ord('0');
      } else {
        throw new InternalError(`bad base ${base}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Tokenizer

  // Existing tokens:
  //    atom(atom)
  //    badatom(string)
  //    number(number)
  //    string(string)
  //    var(term,string)
  //    '/* ...'
  //    ',' | '(' | ' (' | ')' | '[' | ']' | '|' | '{' | '}'
  //    '.' # end of term

  // note: '' is EOF for python

  // const TABSIZE = 4;
  // VSCode needs number of characters instead of columns, so we count tabs as one character (temporary fix)
  const TABSIZE = 1;

  class Position {
    constructor(line = 0, row = -1) {
      this.line = line;
      this.row = row;
    }

    advance(c) {
      if (c === '\n') {
        this.line += 1;
        this.row = -1; // still has to read a character from the new line
      } else if (c === '\t') {
        this.row += TABSIZE; // Assuming TABSIZE is defined somewhere
      } else {
        this.row += 1;
      }
    }

    copy() {
      return new Position(this.line, this.row);
    }

    toString() {
      return `(line ${this.line}, row ${this.row})`;
    }
  }

  class Tokenizer {
    constructor(txt) {
      this.position = new Position();
      this.buff = txt;
      this.buff_i = 0;
    }

    save_token_position() {
      this.saved_position = this.position.copy();
    }

    get_tokens() {
      this.read_tokens();
      this.add_token('end of file', '');
      return this.tokens;
    }

    buffget() {
      if (this.buff_i >= this.buff.length) {
        return '';
      } else {
        const c = this.buff[this.buff_i];
        this.buff_i += 1;
        return c;
      }
    }

    // Read a character
    getct() {
      const c = this.buffget();
      this.position.advance(c);
      this.ch = c;
    }

    // Skip whitespaces and read a character
    getct1() {
      let c;
      while (true) {
        c = this.buffget();
        this.position.advance(c);
        if (!is_whitespace(c)) {
          break;
        }
      }
      this.ch = c;
    }

    // Read until the character i is found
    skip_code(i) {
      let c;
      while (true) {
        c = this.buffget();
        this.position.advance(c);
        if (c === i || c === '') {
          // i is found or end of file
          break;
        }
      }
      this.ch = c;
    }

    add_token(token_kind, token_value) {
      const token = new Token(
        token_kind,
        token_value,
        this.saved_position.copy()
      );
      this.tokens.push(token);
    }

    // TODO: store as a number token, but remember that is was written as a quoted char
    add_token__quoted_char(string) {
      // TODO: unused
      this.add_token('number', string);
    }
    add_token__number(string) {
      this.add_token('number', string);
    }
    add_token__based_number(base, string) {
      this.add_token('number', `${base}'${string}`);
    }
    add_token__quoted_character(string) {
      this.add_token('number', `0'${string}`);
    }

    read_tokens() {
      this.tokens = [];
      this.getct1();

      while (true) {
        this.save_token_position();

        if (this.ch === '') {
          return; // end of file
        } else if (is_whitespace(this.ch)) {
          // layout
          this.getct1();
          this.read_tokens_after_layout();
        } else if (is_lower_char(this.ch)) {
          // small letter: atom
          const ch0 = this.ch;
          this.getct();
          const string = this.read_name();
          this.add_token('atom', ch0 + string);
        } else if (is_upper_char(this.ch)) {
          // capital letter: variable
          const ch0 = this.ch;
          this.getct();
          const string = this.read_name();
          this.add_token('var', ch0 + string);
        } else if (is_digit_char(this.ch)) {
          this.read_number();
        } else if (this.ch === '/') {
          // comment if an '*' follows
          this.getct();
          this.read_possible_comment();
        } else if (this.ch === '.') {
          // end token or graphic atom
          this.getct();
          this.read_fullstop();
        } else if (is_symbol_char(this.ch)) {
          // graphic atom
          const ch0 = this.ch;
          this.getct();
          const chars = this.read_symbol();
          this.add_token('atom', ch0 + chars);
        } else if (this.ch === '!') {
          this.add_token('atom', '!');
          this.getct1();
        } else if (this.ch === ';') {
          this.add_token('atom', ';');
          this.getct1();
        } else if (this.ch === '%') {
          // comment
          while (true) {
            this.getct();
            if (this.ch === '\n' || this.ch === '') {
              // \n is found or end of file
              break;
            }
          }
          this.getct1();
          if (this.ch === '') {
            // end of file
            // Do nothing
          } else {
            this.read_tokens_after_layout();
          }
        } else if (this.ch === '(') {
          this.add_token('solo_nolayout', this.ch);
          this.getct1();
        } else if (
          this.ch === ')' ||
          this.ch === ',' ||
          this.ch === '[' ||
          this.ch === ']' ||
          this.ch === '{' ||
          this.ch === '|' ||
          this.ch === '}'
        ) {
          this.add_token('solo', this.ch);
          this.getct1();
        } else if (this.ch === '"') {
          // string
          this.getct();
          const string = this.read_string('"');
          this.add_token('string', string);
        } else if (this.ch === "'") {
          // 'atom'
          this.getct();
          const string = this.read_string("'");
          this.add_token('atom', string);
        } else {
          throw new InternalError(`unrecognized char: \`${this.ch}'`);
        }
      }
    }

    // The only difference between read_tokens_after_layout(Typ, Ch, D, Tokens)
    // and read_tokens/4 is what they do when Ch is "(".  The former finds the
    // token to be ' (', while the later finds the token to be '('.  This is
    // how the parser can tell whether <atom> <paren> must be an operator
    // application or an ordinary function symbol application.
    read_tokens_after_layout() {
      if (this.ch === '(') {
        this.save_token_position();
        this.add_token('solo', '(');
        this.getct1();
        this.save_token_position();
      }
    }

    read_name() {
      // Read a sequence of letters, digits, and underscores
      let string = '';
      while (is_alphanum_char(this.ch)) {
        string += this.ch;
        this.getct();
      }
      return string;
    }

    read_symbol() {
      // Reads the other kind of atom which needs no quoting: one
      // which is a string of symbol characters
      let string = '';
      while (is_symbol_char(this.ch)) {
        string += this.ch;
        this.getct();
      }
      return string;
    }

    // checks to see whether / + Ch is a / + * comment or a symbol.  If the
    // former, it skips the comment.  If the latter it just calls read_symbol.
    read_possible_comment() {
      if (this.ch === '*') {
        while (true) {
          while (true) {
            this.getct();
            if (this.ch === '*' || this.ch === '') {
              break;
            }
          }
          this.getct();
          if (this.ch === '') {
            this.add_token('solo', '/* ...'); // runaway comment
            return;
          }
          while (this.ch === '*') {
            this.getct();
          }
          if (this.ch === '/') {
            break;
          }
        }
        this.getct1();
        this.read_tokens_after_layout();
        return;
      } else {
        const string = this.read_symbol();
        this.add_token('atom', '/' + string);
      }
    }

    read_fullstop() {
      if (this.ch === '') {
        this.add_token('solo', '.');
      } else if (is_whitespace(this.ch) || this.ch === '%') {
        this.add_token('solo', '.');
        if (this.ch === '%') {
          this.skip_code('\n'); // skip newline
        }
      } else {
        const string = this.read_symbol();
        this.add_token('atom', '.' + string);
      }
    }

    read_string(quote) {
      let string = '';
      while (true) {
        if (this.ch === '') {
          break;
        } else if (this.ch === quote) {
          this.getct();
          if (this.ch === quote) {
            string += quote;
            this.getct();
          } else {
            break;
          }
        } else if (this.ch === '\\') {
          this.getct();
          string = this.read_escape_sequence(string);
        } else {
          string += this.ch;
          this.getct();
        }
      }
      return string;
    }

    // TODO: define a string where the original notation is preserved
    read_escape_sequence(string) {
      if (is_whitespace(this.ch)) {
        this.getct();
      } else if (this.ch === '^') {
        this.getct();
        string += this.control_character();
      } else if (is_digit_char(this.ch) && ord(ch) <= ord('7')) {
        string += this.read_custom_iso(8);
      } else if (this.ch === 'x') {
        this.getct();
        string += this.read_custom_iso(16);
      } else if (this.ch === 'c') {
        this.getct1();
      } else {
        string += this.symbolic_control_char(this.ch);
        this.getct();
      }
      return string;
    }

    control_character() {
      if (this.ch === '?') {
        const char = String.fromCharCode(127);
      } else if (this.ch === '@') {
        const char = String.fromCharCode(0);
      } else if (
        is_upper_char(this.ch) ||
        is_lower_char(this.ch) ||
        (is_symbol_char(this.ch) && ord(ch) >= ord('[') && ord(ch) <= ord('^'))
      ) {
        const char = String.fromCharCode(ord(ch) % 32);
      } else {
        return '^';
      }
      this.getct();
      return char;
    }

    static symbolic_control_char(ch) {
      switch (ch) {
        case 'a':
          return String.fromCharCode(7);
        case 'b':
          return String.fromCharCode(8);
        case 't':
          return String.fromCharCode(9);
        case 'n':
          return String.fromCharCode(10);
        case 'v':
          return String.fromCharCode(11);
        case 'f':
          return String.fromCharCode(12);
        case 'r':
          return String.fromCharCode(13);
        case 'e':
          return String.fromCharCode(27);
        case 's':
          return String.fromCharCode(32);
        case 'd':
          return String.fromCharCode(127);
        default:
          return ch;
      }
    }

    read_custom_iso(base) {
      let string = this.ch;
      this.getct();
      while (this.ch !== '\\') {
        if (custom_digit(base, this.ch)) {
          string += this.ch;
        }
        // ignore other characters
        this.getct();
      }
      return String.fromCharCode(this.number_codes(base, string));
    }

    // TODO: this implementation of number_code is limited (it does not support floating point values)
    number_codes(base, string) {
      let num = 0;
      for (const x of string) {
        num *= base;
        num += custom_digit_value(base, x);
      }
      return num;
    }

    // read_number reads an unsigned integer or float. This is the most difficult
    // part of the tokenizer. There are seven forms of number:
    //   <digits>                                    integer in decimal
    //   <base> ' <base-digits>                      integer in other base (2..36)
    //   <digits> . <digits>                         float
    //   <digits> . <digits> (e|E) (-|+| ) <digits>  float with exponent
    //   0.Nan                                       Not-a-number value
    //   0.Inf                                       Infinite
    //   0 ' <character>                             ascii code of the character
    //   0 b <bin-digits>                            binary integer
    //   0 o <oct-digits>                            octal integer
    //   0 x <hex-digits>                            hexadecimal integer
    read_number() {
      if (this.ch === '0') {
        this.getct();
        this.read_after_0();
      } else {
        const string = this.ch;
        this.getct();
        this.read_digits(string);
      }
    }

    read_after_0() {
      if (is_digit_char(this.ch)) {
        const string = this.ch;
        this.read_digits(string);
      } else if (this.ch === '.') {
        this.getct();
        const string = '0';
        this.read_after_period(string);
      } else if (this.ch === 'b') {
        const string = this.read_based_int(2);
        this.based_int_or_atom(2, 'b', string);
      } else if (this.ch === 'o') {
        const string = this.read_based_int(8);
        this.based_int_or_atom(8, 'o', string);
      } else if (this.ch === 'x') {
        const string = this.read_based_int(16);
        this.based_int_or_atom(16, 'x', string);
      } else if (this.ch === "'") {
        this.getct();
        const n = this.read_quoted_character();
        this.add_token__quoted_char(n);
      } else {
        this.add_token__number('0');
      }
    }

    read_digits(string) {
      while (is_digit_char(this.ch)) {
        string += this.ch;
        this.getct();
      }
      if (this.ch === '.') {
        this.getct();
        this.read_after_period(string);
      } else {
        const base = parseInt(string, 10);
        if (this.ch === "'" && base >= 2 && base <= 36) {
          // "base'number"
          const basedString = this.read_based_int(base);
          this.based_int_or_quoted(base, this.ch, basedString);
        } else {
          this.add_token__number(string);
        }
      }
    }

    read_after_period(string) {
      while (is_digit_char(this.ch)) {
        string += this.ch;
        this.getct();
      }
      if (this.ch === 'e' || this.ch === 'E') {
        string += this.ch;
        this.getct();
        if (this.ch === '-' || this.ch === '+') {
          string += this.ch;
          this.getct();
        }
        while (is_digit_char(this.ch)) {
          string += this.ch;
          this.getct();
        }
      }
      this.add_token__number(string);
    }

    read_after_float(string) {
      while (is_digit_char(this.ch)) {
        string += this.ch;
        this.getct();
      }
      if (this.ch === 'e' || this.ch === 'E') {
        this.getct();
        this.read_after_float_e(this.ch, string);
      } else {
        this.add_token__number(string);
      }
    }

    read_after_float_e(e, string) {
      if (is_digit_char(this.ch)) {
        string += e + this.ch;
        this.getct();
        this.read_after_exp(string);
      } else if (this.ch === '+') {
        this.getct();
        this.read_after_float_e_sign(e, '+', string);
      } else if (this.ch === '-') {
        this.getct();
        this.read_after_float_e_sign(e, '-', string);
      } else {
        this.add_token__number(string);
        this.save_token_position();
        this.token_start_e(e);
      }
    }

    read_after_float_e_sign(e, sign, string) {
      if (is_digit_char(this.ch)) {
        string += e + sign + this.ch;
        this.getct();
        this.read_after_exp(string);
      } else {
        this.add_token__number(string);
        this.save_token_position();
        this.token_start_e_sign(e, sign);
      }
    }

    read_after_exp(string) {
      while (is_digit_char(this.ch)) {
        string += this.ch;
        this.getct();
      }
      this.add_token__number(string);
    }

    token_start_e(e) {
      if (e === 'e') {
        const s0 = this.read_name();
        this.add_token('atom', 'e' + s0);
      } else if (e === 'E') {
        const s0 = this.read_name();
        this.add_token('var', 'E' + s0);
      } else {
        throw new InternalError(`e or E expected in token_start_e, got ${e}`);
      }
    }

    token_start_e_sign(e, sign) {
      if (e === 'e') {
        this.add_token('atom', 'e');
      } else if (e === 'E') {
        this.add_token('var', 'E');
      } else {
        throw new InternalError(
          `e or E expected in token_start_e_sign, got ${e}`
        );
      }
      const chars = this.read_symbol();
      this.add_token('atom', sign + chars);
    }

    // note: valid suffixes are 'Nan' and 'Inf'
    // TODO: use real numberic type for value?
    read_after_dot_suffix(suffix, value) {
      const l = suffix.length;
      let i = 1;
      while (true) {
        if (this.ch === suffix[i]) {
          this.getct();
          i++;
          if (i === l) break;
        } else {
          break;
        }
      }
      if (i === l) {
        this.add_token__number(value);
      } else {
        this.add_token__number('0');
        this.add_token('atom', '.');
        const s0 = this.read_name();
        this.add_token('var', suffix.substring(0, i) + s0);
      }
    }

    read_based_int(base) {
      const maxdigit = ord('0') + base - 1;
      const maxletter_upper = ord('A') + base - 11;
      const maxletter_lower = ord('a') + base - 11;
      this.getct();
      let string = '';
      while (
        (is_digit_char(this.ch) && ord(ch) <= maxdigit) ||
        (is_upper_char(this.ch) && ord(ch) <= maxletter_upper) ||
        (is_lower_char(this.ch) && ord(ch) <= maxletter_lower)
      ) {
        string += this.ch;
        this.getct();
      }
      return string;
    }

    based_int_or_atom(base, l, string) {
      if (string === '') {
        this.add_token__number('0');
        const s0 = this.read_name();
        this.add_token('atom', l + s0);
      } else {
        this.add_token__based_number(base, string);
      }
    }

    based_int_or_quoted(base, l, string) {
      if (string === '') {
        this.add_token__number(base.toString());
        const s = this.read_string("'");
        this.add_token('atom', s);
      } else {
        this.add_token__based_number(base, string);
      }
    }

    // e.g. 0'a 0'b 0'\n ...
    read_quoted_character() {
      while (true) {
        if (this.ch === '\\') {
          this.getct();
          const chars = this.read_escape_sequence('');
          if (chars.length === 0) {
            continue;
          } else if (chars.length === 1) {
            return chars[0];
          } else {
            throw new InternalError(
              `read_escape_sequence returns a non character ${chars}`
            );
          }
        } else if (this.ch === "'") {
          const string = "'";
          this.getct();
          // Accept also only a "'"
          if (this.ch === "'") {
            this.getct();
          }
          return "'";
        } else {
          const n = this.ch;
          this.getct();
          return n;
        }
      }
    }
  }

  class Token {
    constructor(kind, text, position) {
      this.kind = kind;
      this.text = text;
      this.position = position;
    }
  }

  // Exceptions
  class InternalError extends Error {
    constructor(value) {
      super(value);
      this.name = 'InternalError';
      this.value = value;
    }
    toString() {
      return this.value;
    }
  }

  function tokenize(str) {
    let tokenizer = new Tokenizer(str);
    return tokenizer.get_tokens();
  }

  return tokenize;
})();

// ---------------------------------------------------------------------------
// Parser
/*
const a = `
message_pp_success(As,Info,AbsInt,Head,Dict,K,Status,FromMod):-
    prepare_output_info(AbsInt, Info, Head, success, RelInfo),
    copy_term((Head,RelInfo,Dict),(GoalCopy,RelInfoCopy,DictCopy)),
    name_vars(DictCopy),
    prettyvars((GoalCopy,RelInfoCopy)),
    decode_litkey(K,F,A,C,L),
    get_clkey(F,A,C,ClId),
    maybe_clause_locator(ClId,LC), !,
    ( Status == check ->
        display_message_check_pp(LC,
            "At literal ~w could not verify assertion:~n"||
            "~p"||
            "because on success ~p :~n"||
            "~p",
            [L,'$as_pp'(As,FromMod),
             '$left_props'(success,GoalCopy,FromMod),
             '$ana_info'(RelInfoCopy,FromMod)])
`;
//b = `f(! ; ' [ ] { } | )`;
const b = a;
//  inittbl("!;\"'%(),[]{|}",5);

console.log(ciaoTokenize(b));
*/
