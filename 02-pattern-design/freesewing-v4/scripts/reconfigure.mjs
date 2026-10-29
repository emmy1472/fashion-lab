import {
  fs,
  cp,
  readFile,
  writeFile,
  path,
  glob,
  copyFolderRecursively,
  root,
  readJsonFile,
  writeJsonFile,
} from './fs.mjs'
import yaml from 'js-yaml'
import chalk from 'chalk'
import mustache from 'mustache'
import conf from '../lerna.json' with { type: 'json' }
const { version } = conf
import { getSoftware } from './software.mjs'
import { capitalize } from '../packages/utils/src/index.mjs'

/*
 * When we're building a site (on Netlify for example) SITEBUILD
 * will be set and we'll do things differently to speed up the build.
 * To make that check easy, we setup this SITEBUILD variable
 */
const SITEBUILD = process.env.SITEBUILD || false

if (SITEBUILD) console.log('Site build | Configure monorepo accordingly')

/*
 * This object holds info about the repository
 */
const repo = {
  path: root,
  defaults: readConfigFile('defaults.yaml'),
  keywords: readConfigFile('keywords.yaml'),
  badges: SITEBUILD ? null : readConfigFile('badges.yaml'),
  scripts: readConfigFile('scripts.yaml'),
  changelog: SITEBUILD ? null : readConfigFile('changelog.yaml'),
  changetypes: ['Breaking', 'Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'],
  dependencies: readConfigFile('dependencies.yaml', { version }),
  exceptions: readConfigFile('exceptions.yaml'),
  templates: {
    pkg: readTemplateFile('package.dflt.json'),
    changelog: SITEBUILD ? null : readTemplateFile('changelog.dflt.md'),
    readme: SITEBUILD ? null : readTemplateFile('readme.dflt.md'),
    pluginTests: SITEBUILD ? null : readTemplateFile('plugin.test.mjs'),
    designTests: SITEBUILD ? null : readTemplateFile('design.test.mjs.mustache'),
    collection: {
      pkg: readTemplateFile('collection-pkg.mustache'),
      hook: readTemplateFile('collection-hook.mustache'),
      i18n: readTemplateFile('collection-i18n.mustache'),
    },
    i18n: readTemplateFile('i18n.mustache'),
  },
  contributors: SITEBUILD ? null : fs.readFileSync(path.join(root, 'CONTRIBUTORS.md'), 'utf-8'),
  ac: SITEBUILD
    ? null
    : JSON.parse(fs.readFileSync(path.join(root, '.all-contributorsrc'), 'utf-8')),
  software: await getSoftware(),
}

/*
 * Now let's get to work
 */
const log = process.stdout

// Step 0: Avoid symlink so Windows users don't complain
const cpFolders = [
  {
    from: ['sites', 'org', 'plugins'],
    to: ['sites', 'studio', 'plugins'],
  },
  {
    from: ['packages', 'studio', 'template', 'docs'],
    to: ['sites', 'studio', 'docs'],
  },
  {
    from: ['packages', 'studio', 'template', 'src'],
    to: ['sites', 'studio', 'src'],
  },
  {
    from: ['packages', 'studio', 'template', 'static'],
    to: ['sites', 'studio', 'static'],
  },
  {
    from: ['packages', 'studio', 'template', 'scripts'],
    to: ['sites', 'studio', 'scripts'],
  },
  {
    from: ['sites', 'org', 'src', 'css'],
    to: ['sites', 'studio', 'src', 'css'],
  },
  {
    from: ['sites', 'org', 'src', 'pages', 'signin'],
    to: ['sites', 'studio', 'src', 'pages', 'signin'],
  },
  {
    from: ['sites', 'org', 'src', 'pages', 'signup'],
    to: ['sites', 'studio', 'src', 'pages', 'signup'],
  },
]
const cpFiles = [
  {
    from: ['sites', 'org', 'babel.config.mjs'],
    to: ['sites', 'studio', 'babel.config.mjs'],
  },
  {
    from: ['sites', 'org', 'postcss.config.js'],
    to: ['sites', 'studio', 'postcss.config.js'],
  },
  {
    from: ['sites', 'org', 'plugins'],
    to: ['sites', 'studio', 'plugins'],
  },
  {
    from: ['sites', 'org', 'src', 'pages', 'style.mjs'],
    to: ['sites', 'studio', 'src', 'pages', 'style.mjs'],
  },
  {
    from: ['sites', 'studio', 'add.mdx'],
    to: ['sites', 'studio', 'docs', 'add.mdx'],
  },
]
for (const op of cpFolders) await copyFolderRecursively(op.from, op.to)
for (const op of cpFiles) await cp(op.from, op.to)

// Step 1: Generate main README file from template
if (!SITEBUILD) {
  log.write(chalk.blueBright('Templating out main README file...'))
  const template = await readFile(['config', 'templates', 'readme.main.md'])
  await writeFile(
    'README.md',
    mustache.render(template, { allcontributors: repo.ac.contributors.length }) + repo.contributors
  )
  log.write(chalk.green(' Done\n'))
}

// Step 2: Validate package configuration
if (!SITEBUILD) {
  log.write(chalk.blueBright('Validating configuration...'))
  if (validate()) log.write(chalk.green(' Done\n'))
}

// Step 3: Generate package.json, README, and CHANGELOG
log.write(chalk.blueBright('Generating package-specific files...'))
for (const type of ['designs', 'packages', 'plugins']) {
  for (const folder of Object.keys(repo.software[type])) {
    const about = await readJsonFile([type, folder, 'about.json'])
    await writeJsonFile([type, folder, 'package.json'], packageJson(folder, type, about))
    if (!SITEBUILD) {
      await writeFile([type, folder, 'README.md'], readme(folder, type, about))
      await writeFile([type, folder, 'CHANGELOG.md'], changelog(folder, type, about))
      await writeJsonFile([type, folder, 'about.json'], { ...about, version })
    }
  }
}
log.write(chalk.green(' Done\n'))

// Step 4: Generate overall CHANGELOG.md
if (!SITEBUILD) await writeFile('CHANGELOG.md', changelog('global'))

// Step 5: Generate tests for designs and plugins
if (!SITEBUILD) {
  for (const design in repo.software.designs) {
    await writeFile(
      ['designs', design, 'tests', 'shared.test.mjs'],
      mustache.render(repo.templates.designTests, { name: design, Name: capitalize(design) })
    )
  }
  for (const plugin in repo.software.plugins) {
    await writeFile(['plugins', plugin, 'tests', 'shared.test.mjs'], repo.templates.pluginTests)
  }
}

// Step 6: Generate collection package and hook dynamic files
const collection = Object.keys(repo.software.collection)
const designImports = collection
  .map((name) => `import { ${capitalize(name)} as ${name} } from '@freesewing/${name}'`)
  .join('\n')
await writeFile(
  ['packages', 'collection', 'src', 'index.mjs'],
  mustache.render(repo.templates.collection.pkg, {
    designImports,
    collection: collection.join(',\n  '),
  })
)
const collectionI18n = collection
  .map((name) => `import { i18n as ${name} } from '@freesewing/${name}'`)
  .join('\n')
await writeFile(
  ['packages', 'collection', 'src', 'i18n.mjs'],
  mustache.render(repo.templates.collection.i18n, {
    collectionI18n,
    collection: collection.join(',\n  '),
  })
)
await writeFile(
  ['packages', 'react', 'hooks', 'useDesign', 'index.mjs'],
  mustache.render(repo.templates.collection.hook, {
    designImports,
    collection: collection.join(',\n  '),
  })
)

// i18n/designs.mjs is similar to the collection i18n.mjs, but contains all designs, even those not in a collection
const completeDesignImports = Object.keys(repo.software.designs)
  .map((name) => `import { i18n as ${name} } from '@freesewing/${name}'`)
  .join('\n')
const completeDesignMap = Object.keys(repo.software.designs)
  .map((name) => `  ${name}: ${name}.en,`)
  .join('\n')
await writeFile(
  ['i18n', 'designs.mjs'],
  mustache.render(repo.templates.i18n, {
    imports: completeDesignImports,
    designs: completeDesignMap,
  })
)

// Step 7: Remove sites/studio/node_modules

// All done
log.write(chalk.green(' All done\n'))
process.exit()

/**
 * Reads a template file
 */
function readTemplateFile(file) {
  return fs.readFileSync(path.join(root, 'config', 'templates', file), 'utf-8')
}

/**
 * Reads a YAML config file, with mustache replacements if needed
 */
function readConfigFile(file, replace = false) {
  if (replace)
    return yaml.load(
      mustache.render(fs.readFileSync(path.join(root, 'config', file), 'utf-8'), replace)
    )
  return yaml.load(fs.readFileSync(path.join(root, 'config', file), 'utf-8'))
}

/**
 * Reads info.md from the package directory
 * Returns its contents if it exists, or an empty string if not
 */
function readInfoFile(pkg, type) {
  let markup = ''
  try {
    markup = fs.readFileSync(path.join(root, type, pkg, 'info.md'), 'utf-8')
  } catch (err) {
    return ''
  }

  return markup
}

/**
 * Returns an array of keywords for a package
 */
function keywords(pkg, type) {
  if (typeof repo.keywords[pkg] !== 'undefined') return repo.keywords[pkg]
  if (typeof repo.keywords[type] !== 'undefined') return repo.keywords[type]
  if (Object.keys(repo.software.designs).includes(pkg)) return repo.keywords.design
  else return repo.keywords.other
}

/**
 * Returns an plain object of scripts for a package
 */
function scripts(pkg, type) {
  let runScripts = {}
  for (const key of Object.keys(repo.scripts._)) {
    runScripts[key] = mustache.render(repo.scripts._[key], {
      name: pkg,
    })
  }
  if (typeof repo.scripts._types[type] !== 'undefined') {
    for (const key of Object.keys(repo.scripts._types[type])) {
      runScripts[key] = mustache.render(repo.scripts._types[type][key], {
        name: pkg,
      })
    }
  }
  if (typeof repo.scripts[pkg] !== 'undefined') {
    for (const key of Object.keys(repo.scripts[pkg])) {
      if (repo.scripts[pkg][key] === '!') delete runScripts[key]
      else
        runScripts[key] = mustache.render(repo.scripts[pkg][key], {
          name: pkg,
        })
    }
  }

  return runScripts
}

/**
 * Returns an plain object with the of dependencies for a package
 * section is the key in the dependencies.yaml fine, one of:
 *
 *  - _ (for dependencies)
 *  - dev (for devDependencies)
 *  - peer (for peerDependencies)
 *
 */
function dependencies(section, pkg, type) {
  let dependencies = {}
  if (
    typeof repo.dependencies._types[type] !== 'undefined' &&
    typeof repo.dependencies._types[type][section] !== 'undefined'
  )
    dependencies = repo.dependencies._types[type][section]
  if (typeof repo.dependencies[pkg] === 'undefined') return dependencies
  if (typeof repo.dependencies[pkg][section] !== 'undefined')
    return { ...dependencies, ...repo.dependencies[pkg][section] }

  return dependencies
}

/**
 * Creates a package.json file for a package
 */
function packageJson(pkg, type, about) {
  let pkgConf = {}
  // Let's keep these at the top
  pkgConf.name = fullName(about.id)
  pkgConf.version = version
  pkgConf.description = about.description
  pkgConf = {
    ...pkgConf,
    ...JSON.parse(mustache.render(repo.templates.pkg, { name: about.id })),
  }
  pkgConf.keywords = pkgConf.keywords.concat(keywords(pkg, type))
  pkgConf.scripts = scripts(pkg, type)

  if (repo.exceptions.skipTests.includes(pkg)) {
    pkgConf.scripts.test = `echo "skipping tests for ${about.id}"`
    pkgConf.scripts.testci = `echo "skipping tests for ${about.id}"`
  }
  pkgConf.dependencies = dependencies('_', pkg, type)
  pkgConf.devDependencies = dependencies('dev', pkg, type)
  pkgConf.peerDependencies = dependencies('peer', pkg, type)
  if (typeof repo.exceptions.packageJson[pkg] !== 'undefined') {
    pkgConf = {
      ...pkgConf,
      ...repo.exceptions.packageJson[pkg],
    }
    for (let key of Object.keys(repo.exceptions.packageJson[pkg])) {
      if (repo.exceptions.packageJson[pkg][key] === '!') delete pkgConf[key]
    }
  }

  return pkgConf
}

/**
 * Returns an string with the markup for badges in the readme file
 */
function badges(pkgName) {
  let markup = ''
  for (let group of ['_all', '_social']) {
    markup += "<p align='center'>"
    for (let key of Object.keys(repo.badges[group])) {
      const name = key === 'contributors' ? repo.ac.contributors.length : pkgName
      markup += formatBadge(repo.badges[group][key], name, fullName(pkgName))
    }
    markup += '</p>'
  }

  return markup
}

/**
 * Formats a badge for a readme file
 */
function formatBadge(badge, name, fullname) {
  return `<a
  href="${mustache.render(badge.link, { name, fullname })}"
  title="${mustache.render(badge.alt, { name, fullname })}"
  ><img src="${mustache.render(badge.img, { name, fullname })}"
  alt="${mustache.render(badge.alt, { name, fullname })}"/>
  </a>`
}
/**
 * Returns the full (namespaced) name of a package
 */
function fullName(name) {
  if (repo.exceptions.noNamespace.includes(name)) return name
  else return `@freesewing/${name}`
}

/**
 * Creates a README.md file for a package
 */
function readme(pkg, type, about) {
  let markup = mustache.render(repo.templates.readme, {
    fullname: fullName(pkg),
    description: about.description,
    badges: badges(pkg, type),
    info: readInfoFile(pkg, type),
    contributors: repo.contributors,
  })

  return markup
}

/**
 * Creates a CHANGELOG.md file for a package
 */
function changelog(pkg) {
  let markup = mustache.render(repo.templates.changelog, {
    fullname: pkg === 'global' ? 'FreeSewing (global)' : fullName(pkg),
    changelog: pkg === 'global' ? globalChangelog() : packageChangelog(pkg),
  })

  return markup
}

/**
 * Generates the global changelog data
 */
function globalChangelog() {
  let markup = ''
  for (let v in repo.changelog) {
    let changes = repo.changelog[v]
    markup += '\n## ' + v
    if (v !== 'Unreleased') markup += ' (' + formatDate(changes.date) + ')'
    markup += '\n\n'
    for (let pkg of [
      'global',
      ...Object.keys(repo.software.designs),
      ...Object.keys(repo.software.plugins),
      ...Object.keys(repo.software.packages),
    ]) {
      let changed = false
      for (let type of repo.changetypes) {
        if (
          typeof changes[type] !== 'undefined' &&
          changes[type] !== null &&
          typeof changes[type][pkg] !== 'undefined' &&
          changes[type][pkg] !== null
        ) {
          if (!changed) changed = ''
          changed += '\n#### ' + type + '\n\n'
          for (let change of changes[type][pkg].concat(changes[type]?.all || []))
            changed += ' - ' + change + '\n'
        }
      }
      if (changed) markup += '### ' + pkg + '\n' + changed + '\n'
    }
  }

  return markup
}

/**
 * Generates the changelog data for a package
 */
function packageChangelog(pkgName) {
  let version
  let markup = ''
  for (let v in repo.changelog) {
    version = v
    let changes = repo.changelog[v]
    let changed = false
    for (let type of repo.changetypes) {
      if (
        changes[type] &&
        (Array.isArray(changes[type][pkgName]) || Array.isArray(changes[type].all))
      ) {
        if (!changed) changed = ''
        changed += '\n### ' + type + '\n\n'
        if (Array.isArray(changes[type][pkgName])) {
          for (let change of changes[type][pkgName]) changed += ' - ' + change + '\n'
        }
        if (Array.isArray(changes[type].all)) {
          for (let change of changes[type].all) changed += ' - ' + change + '\n'
        }
      }
    }
    if (v !== 'Unreleased' && changed) {
      markup += '\n## ' + v
      markup += ' (' + formatDate(changes.date) + ')'
      markup += '\n'
      markup += changed
    }
  }

  markup += '\n\nThis is the **initial release**, and the start of this change log.\n'
  if (version === '2.0.0')
    markup += `
> Prior to version 2, FreeSewing was not a JavaScript project.
> As such, that history is out of scope for this change log.
`

  return markup
}

function formatDate(date) {
  let d = new Date(date),
    month = '' + (d.getUTCMonth() + 1),
    day = '' + d.getUTCDate(),
    year = d.getUTCFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

/**
 * Make sure we have (at least) a description for each package
 */
function validate() {
  // Nothing to validate, perhaps we should change that

  return true
}
