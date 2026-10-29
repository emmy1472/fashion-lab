import { path, globDir, readJsonFile } from './fs.mjs'

export const getCollection = async () => {
  const designs = await getDesigns()
  const collection = {}
  for (const design in designs) {
    if (designs[design].collection) collection[design] = designs[design]
  }

  return collection
}

export const getDesigns = async () => {
  const designs = {}
  const list = await getFolders('designs')
  for (const design of list) {
    const data = await readJsonFile(['designs', design, 'about.json'])
    if (data !== false && !data.hide) designs[design] = data
  }

  return designs
}

export const getPackages = async () => {
  const packages = {}
  const list = await getFolders('packages')
  for (const pkg of list) {
    const data = await readJsonFile(['packages', pkg, 'about.json'])
    if (data !== false) packages[pkg] = data
  }

  return packages
}

export const getPlugins = async () => {
  const plugins = {}
  const list = await getFolders('plugins')
  for (const plugin of list) {
    const data = await readJsonFile(['plugins', plugin, 'about.json'])
    if (data !== false) plugins[plugin] = data
  }

  return plugins
}

export const getSoftware = async () => ({
  collection: await getCollection(),
  designs: await getDesigns(),
  packages: await getPackages(),
  plugins: await getPlugins(),
})

// Helper
const getFolders = async (dir) =>
  (await globDir(dir, '*')).map((file) => path.basename(file)).sort()

getCollection()
