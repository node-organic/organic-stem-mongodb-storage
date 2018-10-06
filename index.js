#!/usr/bin/env node

const StackUpgrade = require('organic-stack-upgrade')
const path = require('path')
const loadDNA = require('organic-dna-loader')
const getcells = require('organic-dna-cells-info')

const getCWD = async function (stack, cellName) {
  return new Promise((resolve, reject) => {
    loadDNA(path.join(stack.destDir, 'dna'), (err, dna) => {
      if (err) return reject(err)
      let cells = getcells(dna.cells)
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].name === cellName) {
          return resolve(cells[i].cwd)
        }
      }
      reject(new Error('cell ' + cellName + ' not found'))
    })
  })
}

const execute = async function ({destDir = process.cwd(), answers} = {}) {
  let stack = new StackUpgrade({
    destDir: destDir,
    packagejson: path.join(__dirname, '/package.json')
  })
  if (!await stack.checkUpgrade('organic-stem-core-template', '^2.1.0')) {
    throw new Error('organic-stem-core-template ^2.1.0 not found, are you working into the repo root?')
  }
  let resulted_answers = answers || {}
  if (!resulted_answers['cell-name']) {
    resulted_answers['cell-name'] = await stack.ask('cell-name?')
  }
  resulted_answers['cwd'] = await getCWD(stack, resulted_answers['cell-name'])
  resulted_answers['dnaCellDirPath'] = path.dirname(resulted_answers['cwd'])
  resulted_answers = await stack.configure({
    sourceDirs: [path.join(__dirname, 'seed')],
    answers
  })
  await stack.merge({
    sourceDir: path.join(__dirname, 'seed'),
    answers: resulted_answers
  })
  await stack.updateJSON()
  let cellName = resulted_answers['cell-name']
  console.info(`run npm install on ${cellName}...`)
  await stack.exec(`npx angel repo cell ${cellName} -- npm install`)
}

if (module.parent) {
  module.exports = execute
} else {
  execute().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
