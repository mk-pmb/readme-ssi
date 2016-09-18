
<!--#echo json="package.json" key="name" underline="=" -->
readme-ssi
==========
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Update your markdown readme&#39;s ToC and snippets without seperate template
or docs files, according to directives that remind of Server Side Includes.
<!--/#echo -->


Commands
--------
<!--#toc -->
  * [verbatim until](#toc-verbatim-until)
  * [verbatim lncnt](#toc-verbatim-lncnt)
  * [toc](#toc-toc)
  * [echo json](#toc-echo-json)
  * [include file](#toc-include-file)

<!--/#toc -->

All commands are given on a line of their own, in the format
<!--#verbatim until="&," -->
```text
<!--#command opt1="…" opt2="…" -->
```

with zero or more named options and one or more space characters before `-->`.
The quotes are optional for integer values and the empty string value.

If you need quotes, brackets or ampersands in your option values,
please use their XML named entity notation:
```text
  " = &quot;     ' = &apos;     < = &lt;     > = &gt;     & = &amp;
```
CharRefs (e.g. `&#39;`) are not currently supported. Whether and how they
translate to an option value may change at any time. The same applies for
named entities other than those listed above.

When commands replace text, they usually do that up to the next line that
(ignoring space characters and tabs) begins with `<!--`.
  * Recommendation: Use `<!--/#command -->` for the end mark,
    with the name of the command whose replacing is stopped.


<a class="readme-ssi-toc-target" id="toc-verbatim-until" name="toc-verbatim-until"></a>
### verbatim until
Starting from the next line, text that looks like an SSI command will have
no effect, the line will be printed verbatim. This effect is revoked,
and magic re-activated, after the next line whose text is exactly the same
as the value of the `until` option (required).

For some values, there are pre-defined shorthands that look like broken
XML entities:

  * `&,`: a line consisting of 3 accents grave.


<a class="readme-ssi-toc-target" id="toc-verbatim-lncnt" name="toc-verbatim-lncnt"></a>
### verbatim lncnt
Where `lncnt` is a non-negative integer. The next `lncnt` lines won't have
any special effect, even if they might look like an SSI command or a headline
that `toc` would otherwise list.


<a class="readme-ssi-toc-target" id="toc-toc" name="toc-toc"></a>
### toc
Replace text with a generated table of contents.
It will include all lines that start with the headline prefix,
up to the next stop mark or the end of file. The stop mark is:
<!--#include file="README.md" start="&lt;!--snip:toc-stop--&gt;"
  maxln=1 code="" -->
<!--#verbatim lncnt="3" -->
```text
<!--#toc stop="scan" -->
```
<!--/#include -->

<!--  Coming up: &nbsp; and HTML code tag. Because even if Github fixes
      its markdown renderer, there will be others that trim whitespace
      from code quotes. -->
Options:
  * `pfx`: The prefix used for headlines that shall appear in the ToC.
    Listing multiple levels of headlines isn't supoorted yet.
    Default: <code>###&nbsp;</code>
  * `fmt`: The format of the generated ToC lines.
    Default: <code>&nbsp; * &#x5B;&amp;$caption;]&#x28;#&amp;$anchor;)</code>
  * `cap-start`, `cap-end`: Boundary markers for the caption part of your
    headline source line, in case it contains additional decoration like
    status symbols or version number hints.
    * Defaults:
      If `cap-start` is empty or unset, the caption starts right after `pfx`.
      If `cap-end` is empty or unset, the caption ends at the end of its
      source line.
    * The trimming on both sides is greedy.
      `cap-start` goes first, then `cap-end`.
    * Whitespace might be trimmed or not, don't rely on it.
    * You can provide multiple alternative texts for each boundary by
      separating them with the `&#0;` CharRef.
      Greedy trimming will select the most hoggish alternative.
      A literal NUL (U+0000) might work as well, but don't rely on it.
  * `anchor`: Template for what this ToC's anchor names shall look like.
    Any `#` is replaced with an ID generated from the caption part of the
    headline.
    * Helps avoid conflicts when you have multiple ToCs.
    * __Why custom anchors?__
      Trying to guess the auto-generated anchor names produced by various
      markdown parsers turned out to be too unreliable, as their rules for
      converting links, non-american letters and XML CharRefs might change
      at any time.
    * Default: `toc-#`

Work-arounds:
  * After the ToC lines, a blank line will be added in order to help Github
    detect that the list ends, and treat the subsequent comment as a comment.


<a class="readme-ssi-toc-target" id="toc-echo-json" name="toc-echo-json"></a>
### echo json
Replace text with a value from a JSON file. Options:
  * `json`: Data source filename, relative to the readme. Required.
  * `key`: The path to the property that shall be used.
    Empty = root object of the JSON source file.
    If the first character of the path is one of `A-Z`, `a-z`, `0-9`, `_`,
    the path component seperator will be `.`, otherwise the first character
    will be used.
  * `wrap`: Try to wrap lines to this number of characters. Default: 78
  * `before`, `after`: Text that shall be inserted before or after the
    retrieved value. This is done before line wrapping. You can use it
    to add quotes or indentation.
  * `cut-head`, `cut-tail`: Marks for where to chop off decorations from the
    value. They work like `cap-start` and `cap-end` for `toc` (see above),
    with these convenience exceptions:
    * With `json="package.json"` and `key="description"`,
      `cut-tail` defaults to <code>&nbsp;[npm search keywords:&nbsp;</code>.
  * `raw`: If present without a value or set to `1`,
    the data is included as found in the source.
    If unset or empty or set to `0`,
    [some characters are encoded as XML entities][xmlunidefuse],
    most importantly including `<`, `&`, `>`.
    All other values are reserved for future use.


<a class="readme-ssi-toc-target" id="toc-include-file" name="toc-include-file"></a>
### include file
Replace text with lines from another file.
If the very next line after the `include` command is a `verbatim` command,
all text covered by the latter is replaced.

Options:
  * `file`: The source file's name, relative to the file that contains the
    include command. Required.
  * `start`: If set, copying of lines from the source file will only start
    after (not: "at") the first line whose text is exactly the same as the
    value of the `start` option.
  * `stop`: If set, copying will stop just before the first to-be-copied line
    with this option's text.
  * `maxln`: If set to a positive number, copy at most this many lines.
  * `code`: If set,
    * replace text up to and including the next line that consists of three
      accents grave.
    * The text included will be wrapped in a markdown code block denoted by
      these accents. The starting ones will be followed by the value of the
      `code` option, or `text` if the option value is empty.
    * The generated code block will be preceeded by a generated
      `verbatim until="&,"` command in order to have the `toc`
      command ignore it.
  * `indent`: This text will be prepended to any line that is copied from the
    source file.
  * `outdent`: If a line copied from the source file starts with this text,
    remove the `outdent` text. At most one occurrence is removed, and it is
    done before the `indent` option is applied.







<!--snip:toc-stop-->
<!--#toc stop="scan" -->


Caveats
-------
  * No attempt to protect your readme from failing partial writes to file.
    Stage it to git before updating.
  * Trims trailing whitespace from each line. If you need it, use another tool.
  * Trims trailing whitespace from the entire file. If you need some blank
    lines below the actual readme text, just add a comment after them, e.g.
    `<!-- thanks for readme-ssi! -->`
  * Normalizes line endings to `\n`, including one after the last line.
    This is to annoy users of the original MS Windows notepad and save
    a few bytes for anyone else.
  * Data included from external sources might be exempt from some of the
    whitespace normalization rules. Don't rely on it.




  [xmlunidefuse]: https://github.com/mk-pmb/xmlunidefuse-js


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
