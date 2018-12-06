const path = require('path')
const { getOptions } = require('loader-utils')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')
const mergeWith = require('lodash.mergewith')

let globalConfig = null

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }
}

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

function generateFile(configObj, resourcePath, emitFile, options) {
  const { entry, transform } = options || {};

  let fileName = resourcePath.replace(/^.*src\\/, '').replace(/\.vue$/, '')

  if (fileName === 'App' || fileName === 'app') {
    fileName = fileName.toLowerCase()
  } else if (entry) {
    fileName = path.join(fileName, '..', entry.replace(/\.js$/, ''))
  } else if (transform) {
    fileName = transform(fileName, resourcePath)
  }

  emitFile(`${fileName}.json`, JSON.stringify(configObj, null, 2))
}

module.exports = function (source) {
  const { resourcePath, emitFile } = this
  const options = getOptions(this);

  return source.replace(/<script>([^]*)<\/script>/, (match, $1) => {
    const ast = parser.parse($1, { sourceType: 'module' });

    traverse(ast, {
      ObjectProperty(astPath) {
        const { node, parentPath } = astPath
        const { container } = parentPath

        if (!t.isExportDefaultDeclaration(container)) {
          return
        }

        if (node.key.name === 'config') {
          configObj = mergeWith(globalConfig, traverseObjectNode(node), customizer);
          generateFile(configObj, resourcePath, emitFile, options)
          astPath.remove()
        }

        if (node.key.name === 'globalConfig') {
          globalConfig = traverseObjectNode(node)
          astPath.remove()
        }
      }
    })

    const { code } = generate(ast)

    return `<script>${code}<\/script>`
  })
}
