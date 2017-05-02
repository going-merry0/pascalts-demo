define(['intermediate/symtab', 'intermediate/code'],
  function({SymtabEntry, Definition, TypeSpec, TypeForm}, {Code, CodeNode, CodeNodeKey, CodeNodeType, }) {

    const makeTreeJson = (code) => {
      let ret = ''
      try {
        ret = JSON.stringify(makeTreeNodeJson(code.root), null, 2)
      } catch (e) {
        console.error(e)
      }
      return ret
    }

    const makeTreeNodeJson = (codeNode) => {
      const ret = {
        type: null,
        typeSpec: null,
        value: null,
        line: null,
        children: null,
      }

      if (codeNode) {
        ret.type = CodeNodeType[codeNode.type]
        ret.typeSpec = makeTypeSpecJson(codeNode.typeSpec)
        ret.value = codeNode.getAttribute(CodeNodeKey.VALUE)
        ret.line = codeNode.getAttribute(CodeNodeKey.LINE) + 1
        ret.children = codeNode.children.map(n => makeTreeNodeJson(n))

        if (codeNode.type === CodeNodeType.VARIABLE) {
          ret.id = makeIdJson(codeNode.getAttribute(CodeNodeKey.ID))
        }
      }
      return ret
    }

    const makeIdJson = (id) => {
      const ret = {
        name: null,
        definition: null,
        lineNumbers: null,
      }

      if (id) {
        ret.name = id.name
        ret.definition = Definition[id.definition]
        ret.lineNumber = id.lineNumbers.map(ln => ln + 1).join(', ')
      }

      return ret
    }

    const makeTypeSpecJson = (typeSpec) => {
      const ret = {
        form: null,
        lineNumbers: null,
      }

      if (typeSpec) {
        ret.form = TypeForm[typeSpec.form]
        if (typeSpec.identifier) {
          ret.lineNumbers = typeSpec.identifier.lineNumbers.join(', ')
        }
      }

      return ret
    }

    return {
      print: (code) => {
        return makeTreeJson(code)
      }
    }
  })
