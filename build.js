const fs = require('fs')
const path = require('path')

const helios = require('./index')
const args = require('minimist')(process.argv.slice(2))
const source = args._[0] || 'resume.json'

let all = true
for ( let flag of ['pug', 'html', 'sass', 'css', 'js', 'assets'] )
  if ( args[flag] )
    all = false

let json = JSON.parse(fs.readFileSync(source, 'utf8'))
let out = path.join(path.dirname(source), 'build')
if ( !fs.existsSync(out) )
    fs.mkdirSync(out)

if ( all || args['assets'] )
  helios.assets(out)
if ( all || args['pug'] || args['html'] )
  helios.html(json, out)
if ( all || args['sass'] || args['css'] )
  helios.css(out)
if ( all || args['js'] )
  helios.js(out)
