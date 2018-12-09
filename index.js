const path = require('path')
const { getOptions } = require('loader-utils')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')
const mergeWith = require('lodash.mergewith')

let configs = {}
let globalConfig = null
let currentType = null

function customizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }
}

function emitConfig(fileName, configObj, emitFile) {
  const mergedConfig = mergeWith({}, globalConfig, configObj, customizer)
  emitFile(`${fileName}.json`, JSON.stringify(mergedConfig, null, 2))
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

  configs[fileName] = configObj

  emitConfig(fileName, configObj, emitFile)
}

function regenerateFile(emitFile) {
  Object.keys(configs).forEach(key => emitConfig(key, configs[key], emitFile))
}

module.exports = function (source) {
  const { resourcePath, emitFile } = this
  const options = getOptions(this);

  return source.replace(/<script>([^]*)<\/script>/, (match, $1) => {
    const ast = parser.parse($1, { sourceType: 'module' });

    traverse(ast, {
      ExportDefaultDeclaration: {
        enter() {
          currentType = null
        },
        exit() {
          if (currentType === 'page' && !!globalConfig) {
            generateFile({}, resourcePath, emitFile, options)
          }
        }
      },
      ObjectProperty(astPath) {
        const { node, parentPath } = astPath
        const { container } = parentPath

        if (!t.isExportDefaultDeclaration(container)) {
          return
        }

        switch (node.key.name) {
          case 'mpType':
            currentType = node.value.value
            break
          case 'config':
            currentType = null
            configObj = traverseObjectNode(node);
            generateFile(configObj, resourcePath, emitFile, options)
            astPath.remove()
            break
          case 'globalConfig':
            globalConfig = traverseObjectNode(node)
            regenerateFile(emitFile)
            astPath.remove()
            break
        }
      }
    })

    const { code } = generate(ast)

    return `<script>${code}<\/script>`
  })
}
