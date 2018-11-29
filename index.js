const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')

function getObjectKey(prop) {
  const { key } = prop
  return t.isIdentifier(key) ? key.name : key.value
}

function traverseObjectNode(node) {
  if (node.type === 'ObjectProperty') {
    const { properties } = node.value

    return properties.reduce((result, prop) => {
      const key = getObjectKey(prop)
      result[key] = traverseObjectNode(prop.value)
      return result
    }, {})
  }

  if (node.type === 'ObjectExpression') {
    const { properties } = node

    return properties.reduce((result, prop) => {
      const key = getObjectKey(prop)
      result[key] = traverseObjectNode(prop.value)
      return result
    })
  }

  if (node.type === 'ArrayExpression') {
    return node.elements.map(item => traverseObjectNode(item))
  }

  if (node.type === 'NullLiteral') {
    return null
  }

  return node.value
}

module.exports = function (source) {
  const { resourcePath, emitFile } = this
  const fileName = resourcePath.replace(/^.*src\\/, '').replace(/\.vue$/, '')

  return source.replace(/<script>([^]*)<\/script>/, (match, $1) => {
    const ast = parser.parse($1, { sourceType: 'module' });

    traverse(ast, {
      ObjectProperty(astPath) {
        const { node, parentPath } = astPath
        const { container } = parentPath

        if (container.type === 'ExportDefaultDeclaration' && node.key.name === 'config') {
          configObj = traverseObjectNode(node)
          emitFile(`${fileName}.json`, JSON.stringify(configObj, null, 2))
          astPath.remove()
        }
      }
    })

    const { code } = generate(ast)

    return `<script>${code}<\/script>`
  })
}
