(function() {
  'use strict'

  require.config({
    waitSeconds: 30,
    paths: {
      'eventsBrowser': '//cdn.bootcss.com/eventemitter3/2.0.3/index.min',
      'vs': 'https://unpkg.com/monaco-editor@0.8.3/min/vs',
      'astPrinter': 'ast-printer',
      'sprintf': '//cdn.bootcss.com/sprintf/1.0.3/sprintf.min'
    }
  })

  define('events', ['eventsBrowser'], function() {
    return {
      EventEmitter
    }
  })

  const PASCAL_DEF = {
    ignoreCase: true,

    keywords: [
      'and', 'begin', 'end', 'case', 'of', 'const', 'div', 'do', 'downto',
      'if', 'else', 'then', 'for', 'function', 'mod', 'not', 'or',
      'function', 'procedure', 'program', 'repeat', 'until', 'to', 'type',
      'var', 'while'
    ],

    typeKeywords: [
      'integer', 'real', 'array', 'record', 'char', 'boolean'
    ],

    operators: [
      '+', '-', '*', '/', '.', '=', '<>', '<',
      '<=', '>', '>=', '..'
    ],

    // we include these common regular expressions
    symbols: /[+\-*/.=<>()[]{}]+/,

    // The main tokenizer for our languages
    tokenizer: {
      root: [
        // identifiers and keywords
        [/[a-z_$][\w$]*/, {
          cases: {
            '@typeKeywords': 'keyword',
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],
        [/[A-Z][\w\$]*/, 'type.identifier'], // to show class names nicely

        // whitespace
        {
          include: '@whitespace'
        },

        // numbers
        [/\d+?/, 'number'],
        [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],

        // strings
        [/'/, 'string', '@string'],
      ],

      comment: [
        [/[^{}]+/, 'comment'],
        [/{/, 'comment', '@push',],
        ["}", 'comment', '@pop',],
      ],

      string: [
        [/[^']+/, 'string'],
        [/'/, 'string', '@pop']
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/{/, 'comment', '@comment']
      ],
    },
  }

  const mockProcess = () => {
    window.process = {
      hrtime: hrtime,
      stdout: {
        write: function(text) {
          this.buf += text
        },
        buf: ''
      },
      exit: (code) => {
        console.log(`process exited with code: ${code}`)
      }
    }
  }

  require([
    'vs/editor/editor.main',
    'frontend/parser',
    'frontend/source',
    'frontend/scanner',
    'backend/interpreter',
    'astPrinter',
    'intermediate/symtab',
    'sprintf'
  ], function(_, parser, source, scanner, interpreter, astPrinter, symtab, sprintf) {
    const editor = monaco.editor.create(document.getElementById('editor-container'))
    const langId = 'pascal'
    monaco.languages.register({
      id: langId
    })
    monaco.languages.setMonarchTokensProvider(langId, PASCAL_DEF)

    let model = null
    window.samples.onchange = (src) => {
      model = monaco.editor.createModel(src, langId)
      editor.setModel(model)
    }

    let syntaxErrorCount = 0
    window.samples.showDefault()

    const output = $('#output>pre')
    const astOutput = $('#ast>pre')

    $('#btn-run').click(() => {
      output.html('')
      astOutput.html('')
      syntaxErrorCount = 0

      const srcCode = model.getValue()

      mockProcess()

      const src = new source.default(srcCode)
      const sca = new scanner.default(src)
      const pp = new parser.Parser(sca)
      const exe = new interpreter.Executor()

      const TOKEN_FORMAT = `>>>  %-20s line=%03d, pos=%02d, text="%s"`
      const ERROR_LINE_FORMAT = '\n***' + '  %s'
      pp.once(parser.EventType.SYNTAX_ERROR, ({error, token}) => {
        const {lineNum, inlineOffset, type, text, value, lineText} = token
        window.process.stdout.write(sprintf.sprintf(ERROR_LINE_FORMAT, lineText))
        window.process.stdout.write(sprintf.sprintf(`
%${5 + inlineOffset + 1}s`, '^'))
        window.process.stdout.write(sprintf.sprintf('\n' + TOKEN_FORMAT, type.toString(), lineNum, inlineOffset, text, value))
        const v = value
        window.process.stdout.write(sprintf.sprintf(`     %s: %s`, token.constructor.name, error.label))
        output.html(window.process.stdout.buf)
      })

      pp.once(parser.EventType.PARSER_SUMMARY, (arg) => {
        const {elapsedTime, errorCount} = arg

        syntaxErrorCount = errorCount

        const code = pp.symtabStack.programId.get(symtab.SymtabEntryKey.ROUTINE_ICODE)
        astOutput.html(astPrinter.print(code))

        exe.once(interpreter.EventType.INTERPRETER_SUMMARY, (arg) => {
          const {elapsedTime, executionCount, runtimeErrors} = arg

          const summary = sprintf.sprintf(`
-----------------------------------------------
%d statements executed.
%d runtime errors.
%ds %fms total execution time.
`, executionCount, runtimeErrors, elapsedTime[0], elapsedTime[1] / 1000000)

          window.process.stdout.write(summary)
          output.html(window.process.stdout.buf)
        })

        exe.process(pp.code, pp.symtabStack)
      })

      pp.parse()
    })
  })
})()
