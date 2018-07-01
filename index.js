const fs = require('fs')
const path = require('path')
const _ = require('underscore')

const success = '\x1b[32m√\x1b[0m '
const fail = '\x1b[31m×\x1b[0m '

exports.html = function(json, out) {
  const pug = require('pug')
  const buildpage = pug.compileFile('pug/main.pug')

  const dateformat = require('dateformat')
  const markdownit = require('markdown-it')({breaks: true, linkify: true})
  const md = (text) => markdownit.renderInline(text || '').replace(/\r?\n|\r/g, '').replace(/<br><br>/g, '</p><p>')

  let pages = _.union(_.clone(json.portfolio), [
    {id: '404', title: json.flavor.error.title, summary: json.flavor.error.details},
    {id: 'index', banner: true}
  ])

  for ( let page of pages ) {
    let html = buildpage({_: _, md: md, dateformat: dateformat, site: json, page: page})

    fs.writeFileSync(path.join(out, page.id + '.html'), html, 'utf8')
    console.log(success + 'Written ' + page.id + '.html')
  }
}

exports.css = function(out) {
  const sass = require('sass')
  const sheets = ['main', 'noscript']

  for ( let sheet of sheets ) {
    let css = sass.renderSync({file: 'sass/' + sheet + '.scss', outputStyle: 'compressed'})

    fs.writeFileSync(path.join(out, sheet + '.css'), css.css, 'utf8')
    console.log(success + 'Written ' + sheet + '.css')
  }
}

exports.js = function(out) {
  const nmin = require('node-minify')
  const scripts = [
    'jquery.min.js', 'jquery.dropotron.min.js', 'jquery.scrolly.min.js', 'jquery.scrollex.min.js',
    'browser.min.js', 'breakpoints.min.js', 'svgxuse.min.js',
    'util.js', 'main.js'
  ]

  nmin.minify({
    compressor: 'gcc',
    input: _.map(scripts, script => 'js/' + script),
    output: path.join(out, 'scripts.js'),
    callback: error =>
      console.log(error && (fail + 'Failed to compress scripts.js') || (success + 'Written scripts.js'))
  })
}
