import {
  fs,
  cp,
  path,
  globDir,
  copyFolderRecursively,
  mkdir,
  rm,
  root,
  templateOut,
  writeJsonFile,
} from './fs.mjs'
import prompts from 'prompts'
import chalk from 'chalk'
import { banner } from './banner.mjs'
import { execSync } from 'child_process'
import languages from '../config/languages.json' assert { type: 'json' }
import { getDesigns, getPlugins } from './software.mjs'
import conf from '../lerna.json' assert { type: 'json' }
const { version } = conf

const designs = await getDesigns()
const plugins = await getPlugins()

/*
 * Ask input about what the user wants
 */
export const getInput = async () => {
  let type = false
  let template = false
  let name = false
  let finalName = false

  // while we're not finalized on a name
  while (finalName === false) {
    // request type
    type = (
      await prompts({
        type: 'select',
        name: 'type',
        message: ' Would you like to add a new design, or a new plugin?',
        choices: [
          {
            title: 'Add a new FreeSewing Design',
            value: 'design',
            description: 'Add a new design',
          },
          {
            title: 'Add a new FreeSewing Plugin',
            value: 'plugin',
            description: 'Add a new plugin',
          },
        ],
      })
    ).type

    // If they Ctrl-C'd out of the prompt, exit here
    if (!type) process.exit()

    // request a name
    name = (
      await prompts({
        type: 'text',
        name: 'name',
        message: ` Give a name for your new ${type}. Please stick to [a-z] only. 🏷️ `,
        initial: type === 'plugin' ? 'coffee' : 'xiaomao',
      })
    ).name

    // check whether a folder with that name already exists
    const dest = path.join(root, type + 's', type === 'plugin' ? `plugin-${name}` : name)
    try {
      const dir = await opendir(dest)
      dir.close()
    } catch {
      // the folder didn't exist, so we're good to go
      finalName = true
      break
    }

    // the folder did exist, bail out
    const { nextStep } = await prompts({
      type: 'select',
      name: 'nextStep',
      message: 'It looks like that folder already exists. What should we do?',
      choices: [
        { title: 'Go back', value: 'rename', description: 'Choose a different name' },
        {
          title: 'Exit',
          value: 'exit',
          description: 'Exit here so you can investigate',
        },
      ],
    })

    // if they said rename, we loop again. Otherwise, we exit
    if (nextStep !== 'rename') process.exit()
  }

  // request a template
  if (type === 'design')
    template = (
      await prompts({
        type: 'select',
        name: 'template',
        message: ' What template would you like to start from?',
        choices: [
          { title: 'Create a design from scratch', value: 'base' },
          { title: 'Extend the Brian block (flat-sleeve block for menswear)', value: 'brian' },
          { title: 'Extend the Bent block (two-part-sleeve block for menswear)', value: 'bent' },
          { title: 'Extend the Bella block (womenswear bodice block)', value: 'bella' },
          { title: 'Extend the Breanna block (womenswear bodice block)', value: 'breanna' },
          { title: 'Extend the Sarah block (unisex skirt block)', value: 'sarah' },
          { title: 'Extend the Titan block (unisex trouser block)', value: 'titan' },
        ],
        initial: 0,
      })
    ).template
  return { type, name: name.toLowerCase(), template }
}

async function addDesign({ name, template }) {
  if (name && template) {
    const valid = validateDesignName(name)
    if (valid !== true) {
      console.log(valid)
      process.exit()
    }
    await createDesign(name, template)
    execSync('npm run reconfigure')
    execSync('npm install')
    console.log(`

  👉  We've created your design skeleton at ${chalk.green('designs/' + name)}
  👉  We've added ${chalk.green(name)} to the FreeSewing collection

  🚧 We used placeholder metadata; Update it in ${chalk.green('designs/' + name + '/about.json')}
  📦 If you need additional plugins or patterns to extend, update ${chalk.green(
    'config/dependencies.yaml'
  )}

  🚀  You can now start the studio with ${chalk.blue('npm run studio')}
  📖  Documentation is available at ${chalk.green('https://freesewing.dev/')}
  🤓  Happy hacking

    `)
  }
}

async function addPlugin({ name }) {
  if (name) {
    const valid = validatePluginName(name)
    if (valid !== true) {
      console.log(valid)
      process.exit()
    }
    createPlugin(name)
    execSync('npm run reconfigure')
    console.log(`

  👉  We've created your plugin skeleton at ${chalk.green('plugins/plugin-' + name)}

  🚧  We used a placeholder description; Update it in ${chalk.green(
    'plugins/plugin-' + name + '/about.json'
  )}
  👷  To make your plugin do something awesome, edit ${chalk.green(
    'plugins/plugin-' + name + '/src/index.mjs'
  )}

  📖  Documentation is available at ${chalk.green('https://freesewing.dev/')}
  🤓  Happy hacking
    `)
  }
}

function validateDesignName(name) {
  if (Object.keys(designs).includes(name.toLowerCase()))
    return `Sorry but ${name} is already taken so you'll need to pick something else`

  if (/^([a-z][a-z0-9_]*)$/.test(name)) return true
  else
    return ' 🙈 Please use only lowercase letters, digits, or underscores. Names must start with a lowercase letter. 🤷'
}

function validatePluginName(name) {
  const pluginName = 'plugin-' + name
  if (Object.keys(plugins).includes(pluginName.toLowerCase()))
    return `Sorry but ${pluginName} is already taken so you'll need to pick something else`

  if (/^([a-z-]+)$/.test(name)) return true
  else return ' 🙈 Please use only [a-z] or dash, no spaces, no capitals, no nothing 🤷'
}

async function createDesign(name, template) {
  const src = ['packages', 'studio', 'template', 'designs', `.${template}`]
  const target = ['designs', name]
  const Name = name.charAt(0).toUpperCase() + name.slice(1)

  // Copy template folder
  await copyFolderRecursively(src, target)

  // Template various mustache files
  const files = (await globDir(target, '**/*.mustache'))
    .map((file) => file.split(`designs${path.sep}${name}${path.sep}`).pop().split(path.sep))
    .map((found) => ({
      from: [...target, ...found],
      to: [...target, ...found.slice(0, -1), found.slice(-1).pop().split('.mustache')[0]],
    }))
  for (const file of files) {
    await templateOut(file.from, file.to, { name, Name })
    await rm(file.from)
  }

  // Create about.json
  await writeJsonFile([...target, 'about.json'], {
    id: name,
    code: 'Your name here',
    design: 'Your name here',
    description: 'A FreeSewing pattern that needs a description',
    name: `${Name} Something`,
    difficulty: 2,
    tags: [],
    techniques: [],
    version,
    pkg: `@freesewing/${name}`,
    collection: true,
  })
}

function createPlugin(name) {
  const pluginName = 'plugin-' + name
  const template = ['config', 'templates', 'plugin']
  const description = 'A FreeSewing plugin that needs a description'
  const plugin = ['plugins', pluginName]
  const capitalized_name = name.charAt(0).toUpperCase() + name.slice(1)

  // Create folders
  mkdir([...plugin, 'src'])
  mkdir([...plugin, 'tests'])

  // Create package.json
  templateOut([...template, 'package.json.mustache'], [...plugin, 'package.json'], {
    pluginName,
    description,
  })

  //Create about.json
  templateOut([...template, 'about.json.mustache'], [...plugin, 'about.json'], { name })

  // Create index.mjs
  templateOut([...template, 'src', 'index.mjs.mustache'], [...plugin, 'src', 'index.mjs'], {
    name,
    capitalized_name,
  })
}

function orderDesigns(designs) {
  // Ensure designs are listed alphabetically
  const newDesigns = {}
  for (const type in designs) {
    newDesigns[type] = {}
    for (const design of Object.keys(designs[type]).sort()) {
      newDesigns[type][design] = designs[type][design]
    }
  }

  return newDesigns
}
function orderPlugins(plugins) {
  // Ensure plugins are listed alphabetically
  const newPlugins = {}
  for (const plugin of Object.keys(plugins).sort()) {
    newPlugins[plugin] = plugins[plugin]
  }

  return newPlugins
}

// Say hi, then prompt for input
console.log(banner, '\n\n')
const input = await getInput()

// Add new design
if (input.type === 'design') addDesign(input)
if (input.type === 'plugin') addPlugin(input)
