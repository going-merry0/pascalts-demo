(function() {
  'use strict'

  requirejs.config({
    paths: {
      'vs': 'node_modules/monaco-editor/min/vs'
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

  require(['vs/editor/editor.main'], function() {
    const editor = monaco.editor.create(document.getElementById('editor-container'))
    const langId = 'pascal'
    monaco.languages.register({
      id: langId
    })
    monaco.languages.setMonarchTokensProvider(langId, PASCAL_DEF)
    window.samples.onchange = (src) => {
      const model = monaco.editor.createModel(src, langId)
      editor.setModel(model)
    }

    window.samples.showDefault()
  })
})()
