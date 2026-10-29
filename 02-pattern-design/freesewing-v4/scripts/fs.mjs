/*
 * Various helper methods to handle file system access
 */
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import mustache from 'mustache'

/**
 * Re-export these
 */
export { fs, path, glob, mustache }

/**
 * The monorepo root folder
 */
export const root = path.resolve(path.basename(import.meta.url), '..')

/**
 * Copies a file
 *
 * @param {arrau} src - Source file
 * @param {array} dst - Destination file
 * @param {object} options - Options for the fs.cp call in NodeJS
 *
 */
export async function cp(src, dst, options = {}) {
  if (!Array.isArray(src)) src = [src]
  if (!Array.isArray(dst)) dst = [dst]
  try {
    await fs.promises.cp(path.resolve(root, ...src), path.resolve(root, ...dst), options)
  } catch (err) {
    return false
  }

  return true
}

/**
 * Removes a file
 *
 * @param {array} file - Path to the file to remove
 * @param {object} options - Options for NodeJS' rm method
 *
 */
export async function rm(file, options = { force: true }) {
  if (!Array.isArray(file)) file = [file]
  try {
    await fs.promises.rm(path.resolve(root, ...file), options)
  } catch (err) {
    return false
  }

  return true
}

/**
 * Reads a folder from disk with an optional glob pattern
 *
 * @param {string} (relative) path to the file to read
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function globDir(
  folderPath, // The (relative) path to the folder
  pattern = '**/*' // Glob pattern to match
) {
  if (!Array.isArray(folderPath)) folderPath = [folderPath]
  let list = []
  try {
    list = await glob(path.resolve(root, ...folderPath) + '/' + pattern)
  } catch (err) {
    if (err) console.log(err)
    return false
  }

  return list
}

/**
 * Creates a directory/folder
 *
 * @param {string} dirPath - (relative) path to the folder to create
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function mkdir(
  dirPath, // The (relative) path to the folder to create
  onError // Method to run on error
) {
  if (!Array.isArray(dirPath)) dirPath = [dirPath]
  let dir
  try {
    dir = path.resolve(root, ...dirPath)
    await fs.promises.mkdir(dir, { recursive: true })
  } catch (err) {
    if (onError) onError(err)

    return false
  }
  return true
}

/**
 * Reads a file from disk
 *
 * @param {string} (relative) path to the file to read
 * @param {funtion} onError - a method to call on error
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function readFile(
  filePath, // The (relative) path to the file
  onError, // Method to run on error
  binary = false
) {
  if (!Array.isArray(filePath)) filePath = [filePath]
  let content, file
  try {
    file = path.resolve(root, ...filePath)
    content = await fs.promises.readFile(file, binary ? undefined : 'utf-8')
  } catch (err) {
    if (onError) onError(err)

    return false
  }
  return content
}

/**
 * Reads a JSON file from disk and parses it
 *
 * @param {string} path - (relative) path to the file to read
 * @param {string} onError - a string to log on error rather than the default
 *
 * @return {string} File contents, or false in case of trouble
 */
export async function readJsonFile(
  filePath, // The (relative) path to the file
  onError // Method to run on error
) {
  if (!Array.isArray(filePath)) filePath = [filePath]
  let content
  try {
    content = await readFile(path.join(root, ...filePath), onError, true)
    content = JSON.parse(content)
  } catch (err) {
    if (onError) onError(err)

    return false
  }

  return content
}

/**
 * Templates out a file with mustache
 *
 * @param {array} from - The source template file
 * @param {array} to - The destination file
 * @param {object] data - Substitutions for the template
 */
export async function templateOut(from, to, data) {
  if (!Array.isArray(from)) from = [from]
  if (!Array.isArray(to)) to = [to]
  try {
    const src = await readFile(from)
    await writeFile(to, mustache.render(src, data))
  } catch (err) {
    console.log(err)
  }

  return true
}

/**
 * Writes a file to disk
 *
 * @param {string} filePath - (relative) path to the file to write
 * @param {string} data - the data to write to disk
 * @param {function} log - a logger instance (or false)
 * @param {octal} mode - a mode for chmod
 *
 * @return {bool} true of success, false in case of trouble
 */
export async function writeFile(
  filePath, // The (relative) path to the file
  data, // The data to write to disk
  log = false,
  mode = 0o666
) {
  if (!Array.isArray(filePath)) filePath = [filePath]
  let file
  try {
    file = path.resolve(root, ...filePath)
    await fs.promises.mkdir(path.dirname(file), { recursive: true })
    await fs.promises.writeFile(file, data)
    await fs.promises.chmod(file, mode)
  } catch (err) {
    if (log) log.warn(err, `Failed to write file: ${file}`)
    else console.log(`Failed to write file: ${file}`)

    return false
  }

  return true
}

/**
 * Writes a JSON file to disk
 *
 * @param {string} filePath - (relative) path to the file to write
 * @param {string} data - the data to write to disk as a Javascript object
 *
 * @return {bool} true of success, false in case of trouble
 */
export async function writeJsonFile(filePath, data, log, mode) {
  return await writeFile(filePath, JSON.stringify(data, null, 2), log, mode)
}

/**
 * Reads the contents of a directory (non-recursive)
 *
 * @param {string} dirPath - (relative) path to the directory to read
 * @param {funtion} onError - a method to call on error
 */
export async function readDirectory(dirPath, onError) {
  if (!Array.isArray(dirPath)) dirPath = [dirPath]
  let files
  try {
    const dir = path.resolve(root, ...dirPath)
    files = await fs.promises.readdir(dir)
  } catch (err) {
    if (onError) onError(err)

    return false
  }

  return files
}

/**
 * Copies a folder recursively
 *
 * @param {string} srcDir - The source folder to copy
 * @param {string} dstDir - The destination folder
 */
export async function copyFolderRecursively(srcDir, dstDir) {
  /*
   * Ensure target folder exists
   */
  await mkdir(dstDir)
  /*
   * Glob all files to copy
   * Generate relative from and to arrays
   */
  const files = (await globDir(srcDir, '**/*'))
    .sort()
    .map((target) => target.split(root).pop().slice(1).split('/'))
    .map((target) => ({
      from: target,
      to: [...dstDir, ...target.slice(srcDir.length)],
    }))
  /*
   * Copy files, create folders
   */
  for (const op of files) {
    const stat = fs.statSync(path.join(root, ...op.from))
    if (stat.isDirectory()) await mkdir(op.to)
    else await cp(op.from, op.to)
  }
}
