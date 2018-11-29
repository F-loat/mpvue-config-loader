const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')

function getObjectKey(prop) {
  const { key } = prop
  return t.isIdentifier(key) ? key.name : key.value
}

function traverseObjectNode(node) {
  const isObjectExpression = t.isObjectExpression(node)
  const isObjectProperty = t.isObjectProperty(node)

  if (isObjectExpression || isObjectProperty) {
    const { properties } = isObjectExpression ? node : node.value
    return properties.reduce((result, prop) => {
      const key = getObjectKey(prop)
      result[key] = traverseObjectNode(prop.value)
      return result
    }, {})
  } else if (t.isArrayExpression(node)) {
    return node.elements.map(item => traverseObjectNode(item))
  } else if (t.isNullLiteral(node)) {
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

        if (t.isExportDefaultDeclaration(container) && node.key.name === 'config') {
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
