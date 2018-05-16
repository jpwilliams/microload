// core libs
const { statSync, accessSync, readdirSync, constants } = require('fs')
const { resolve, dirname, basename, sep, relative, extname } = require('path')

// public libs
const callsites = require('callsites')
const glob = require('glob')
const { set } = require('lodash')

// setup
const re = new RegExp('^[^\\.].*\\.js(on)?$')

function getCallingDir () {
  return dirname(callsites()[2].getFileName())
}

function microload (path, opts = {}) {
  if (!path || !path.length) {
    throw new Error('A path to load must be specified.')
  }

  const cwd = opts.hasOwnProperty('cwd') ? opts.cwd : getCallingDir()
  const root = resolve(cwd, path)

  const files = lookup(path, cwd)

  return files.reduce((obj, file) => {
    const chunks = relative(root, file).split(sep).filter(Boolean)
    const lastChunk = chunks[chunks.length - 1]
    chunks[chunks.length - 1] = basename(lastChunk, extname(lastChunk))

    const setPath = chunks.reduce((bits, chunk) => {
      bits += `['${chunk}']`

      return bits
    }, '')

    set(obj, setPath, require(file))

    return obj
  }, {})
}

function lookup (path, cwd) {
  const files = []
  let absolutePath = resolve(cwd, path)

  const stats = statSync(absolutePath, constants.R_OK)

  if (!stats) {
    const fileExists = accessSync(`${absolutePath}.js`, constants.R_OK)

    if (!fileExists) {
      const foundFiles = glob.sync(absolutePath)

      files.push(...foundFiles.filter((file) => {
        return re.test(file)
      }))

      return files
    }

    absolutePath += '.js'
  }

  if (stats.isFile()) {
    files.push(absolutePath)

    return files
  }

  const foundFiles = readdirSync(absolutePath)

  for (let n = 0; n < foundFiles.length; n++) {
    const resolvedFile = resolve(absolutePath, foundFiles[n])
    const fileStats = statSync(resolvedFile)

    if (fileStats.isDirectory()) {
      files.push(...lookup(resolvedFile))

      continue
    }

    if (!fileStats.isFile() || !re.test(resolvedFile)) {
      continue
    }

    files.push(resolvedFile)
  }

  return files
}

module.exports = { microload }
