const fs = require('fs')
const _ = require('underscore')

const options = _.object(_.map(process.argv, v => [v, true]))
const success = '\x1b[32m√\x1b[0m '
const fail = '\x1b[31m×\x1b[0m '

if ( !fs.existsSync('build') )
    fs.mkdirSync('build')

if ( options['-pug'] ) {
  const pug = require('pug')
  const makePage = pug.compileFile('pug/main.pug')

  const markdownit = require('markdown-it')({breaks: true, linkify: true})
  const md = (text) => markdownit.renderInline(text || '').replace(/\r?\n|\r/g, '').replace(/<br><br>/g, '</p><p>')

  let data = JSON.parse(fs.readFileSync('resume.json', 'utf8'))
  let pages = _.union(_.clone(data.portfolio), [
    {id: 'index', banner: true, carousel: true},
    {id: '404', title: data.web.error.title, summary: data.web.error.summary}
  ])

  for (page of pages) {
    let html = makePage({_: _, md: md, site: data, page: page})

    fs.writeFileSync('build/' + page.id + '.html', html, 'utf8')
    console.log(success + 'Written ' + page.id + '.html')
  }
}

if ( options['-js'] ) {
  const nmin = require('node-minify')
  const scripts = [
    'jquery.min.js', 'jquery.dropotron.min.js', 'jquery.scrolly.min.js', 'jquery.scrollex.min.js',
    'browser.min.js', 'breakpoints.min.js', 'svgxuse.min.js',
    'util.js', 'main.js'
  ]

  nmin.minify({
    compressor: 'gcc',
    input: _.map(scripts, script => 'js/' + script),
    output: 'build/scripts.js',
    callback: error =>
      console.log(error && (fail + 'Failed to compress scripts.js') || (success + 'Written scripts.js'))
  })
}

if ( options['-sass'] ) {
  const sass = require('sass')
  const sheets = ['main', 'noscript']

  for ( sheet of sheets ) {
    let css = sass.renderSync({file: 'sass/' + sheet + '.scss', outputStyle: 'compressed'})

    fs.writeFileSync('build/' + sheet + '.css', css.css, 'utf8')
    console.log(success + 'Written ' + sheet + '.css')
  }
}
