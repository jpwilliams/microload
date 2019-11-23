// core libs
const { statSync, accessSync, readdirSync, constants, readFileSync } = require('fs')
const { resolve, dirname, basename, sep, relative, extname } = require('path')

// public libs
const callsites = require('callsites')
const glob = require('glob')
const { set } = require('lodash')

function getCallingDir () {
	return dirname(callsites()[2].getFileName())
}

function loadString (path) {
		return readFileSync(path, 'utf8')
}

function microload (path, opts = {}) {
	if (!path || !path.length) {
		throw new Error('A path to load must be specified.')
	}

	const cwd = opts.hasOwnProperty('cwd') ? opts.cwd : getCallingDir()
	let extensions

	if (opts.hasOwnProperty('extensions')) {
		let handledExts = opts.extensions

		if (Array.isArray(handledExts)) {
			handledExts = handledExts.reduce((map, ext) => {
				map[ext] = null

				return map
			}, {})
		}

		if (typeof handledExts === 'object') {
			extensions = Object.keys(handledExts).reduce((map, key) => {
				const normalisedKey = key.startsWith('.') ? key.slice(1) : key
				const extRe = /^js(on)?$/gm
				const fn = handledExts[key]

				map[normalisedKey] = fn
					? fn
					: extRe.test(normalisedKey)
						? require
						: loadString

				return map
			}, {})
		}
	} else {
		extensions = {
			js: require,
			json: require
		}
	}

	const re = new RegExp(`^[^\\.].*\\.(${Object.keys(extensions).join('|')})$`)
	const root = resolve(cwd, path)
	const files = lookup(path, cwd, re)

	return files.reduce((obj, file) => {
		const chunks = relative(root, file).split(sep).filter(Boolean)
		const lastChunk = chunks[chunks.length - 1]
		const ext = extname(lastChunk)
		chunks[chunks.length - 1] = basename(lastChunk, ext)

		const setPath = chunks.reduce((bits, chunk) => {
			bits += `['${chunk}']`

			return bits
		}, '')
		
		set(obj, setPath, extensions[ext.slice(1)](file))

		return obj
	}, {})
}

function lookup (path, cwd, re) {
	const files = []
	let absolutePath = resolve(cwd, path)
	if (basename(absolutePath)[0] === '.') return []

	const stats = statSync(absolutePath)

	if (!stats) {
		const fileExists = accessSync(`${absolutePath}.js`, constants.R_OK)

		if (!fileExists) {
			const foundFiles = glob.sync(absolutePath)

			files.push(...foundFiles.filter((file) => {
				return re.test(file) && basename(file)[0] !== '.'
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
			files.push(...lookup(resolvedFile, null, re))

			continue
		}
		
		if (
			!fileStats.isFile() ||
			!re.test(resolvedFile) ||
			basename(resolvedFile)[0] === '.'
		) {
			continue
		}

		files.push(resolvedFile)
	}

	return files
}

module.exports = { microload }
