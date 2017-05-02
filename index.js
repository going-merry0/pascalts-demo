(function() {
  'use strict'

  require.config({
    paths: {
      'eventsBrowser': '//cdn.bootcss.com/eventemitter3/2.0.3/index.min',
      'vs': 'node_modules/monaco-editor/min/vs',
      'astPrinter': 'ast-printer'
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

  require([
    'vs/editor/editor.main',
    'frontend/parser',
    'frontend/source',
    'frontend/scanner',
    'backend/interpreter',
    'astPrinter',
    'intermediate/symtab'
  ], function(_, parser, source, scanner, interpreter, astPrinter, symtab) {
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

      // monaco seems use the global process to detect it's runtime environment 
      // is whether nodejs or browser so we need to unset the mock process after we done our job
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

      const src = new source.default(srcCode)
      const sca = new scanner.default(src)
      const pp = new parser.Parser(sca)
      const exe = new interpreter.Executor()

      pp.on(parser.EventType.PARSER_SUMMARY, (arg) => {
        const {elapsedTime, errorCount} = arg
        console.info(errorCount, elapsedTime[0], elapsedTime[1] / 1000000)

        syntaxErrorCount = errorCount

        const code = pp.symtabStack.programId.get(symtab.SymtabEntryKey.ROUTINE_ICODE)
        astOutput.html(astPrinter.print(code))

        exe.on(interpreter.EventType.INTERPRETER_SUMMARY, (arg) => {
          output.html(window.process.stdout.buf)
        })

        exe.process(pp.code, pp.symtabStack)

        // unset mock process
        window.process = undefined
      })

      pp.parse()
    })
  })
})()
