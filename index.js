#!/usr/bin/env node

const StackUpgrade = require('organic-stack-upgrade')
const path = require('path')
const fs = require('fs')

const pathExists = async function (filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stats) => {
      if (err) return reject(err)
      resolve(stats)
    })
  })
}

const execute = async function ({destDir = process.cwd(), answers} = {}) {
  let stack = new StackUpgrade({
    destDir: destDir,
    name: 'organic-stem-mongodb-storage',
    version: '1.0.0'
  })
  let coreTemplateExists = await stack.checkUpgrade('organic-stem-core-template', '^1.0.0')
  if (!coreTemplateExists) throw new Error('organic-stem-core-template ^1.0.0 required')
  let resulted_answers = await stack.configure({
    sourceDir: path.join(__dirname, 'seed'),
    answers
  })
  let cellName = resulted_answers['cell-name']
  let cellBuildDNAPath = path.join(destDir, 'dna', 'cells', cellName + '.json')
  let cellBuildDNAPathExists = await pathExists(cellBuildDNAPath)
  if (!cellBuildDNAPathExists) throw new Error(cellBuildDNAPath + ' required')
  await stack.merge({
    sourceDir: path.join(__dirname, 'seed'),
    answers: resulted_answers
  })
  await stack.updateJSON()
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
