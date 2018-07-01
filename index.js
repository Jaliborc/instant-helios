const fs = require('fs')
const path = require('path')
const _ = require('underscore')

const success = '\x1b[32m√\x1b[0m '
const fail = '\x1b[31m×\x1b[0m '
let built = {}

exports.html = function(json, out) {
  const pug = require('pug')
  const buildpage = pug.compileFile('pug/main.pug')

  const moment = require('moment')
  const markdownit = require('markdown-it')({breaks: true, linkify: true})
  const md = (text) => markdownit.renderInline(text || '').replace(/\r?\n|\r/g, '').replace(/<br><br>/g, '</p><p>')
  const resize = (img, w, h) => exports.image(img, w, h, out)

  let pages = _.union(_.clone(json.portfolio), [
    {id: '404', title: json.flavor.error.title, summary: json.flavor.error.details},
    {id: 'index', banner: true}
  ])

  for ( let page of pages ) {
    let html = buildpage({_: _, md: md, moment: moment, resize:resize, site: json, page: page})

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

exports.assets = function(out) {
  fs.readdirSync('assets').forEach(file => {
    fs.createReadStream(path.join('assets', file)).pipe(fs.createWriteStream(path.join(out, file)));
    console.log(success + 'Written ' + file)
  })
}

exports.image = function(imgpath, width, height, out) {
  const jimp = require('jimp')
  const crypto = require('crypto')

  let id = crypto.createHash('md5').update(imgpath + '?' + width + '?' + height).digest('hex')
  let outname = path.join('resized', id + path.extname(imgpath))

  jimp.read(imgpath, (error, img) => {
    if ( !built[outname] ) {
      if (img)
        img.cover(width, height).write(path.join(out, outname))

      built[outname] = true
      console.log((error && (fail + 'Failed to resize') || (success + 'Written ')) + outname + ' (' + imgpath + ')')
    }
  })

  return outname
}
