const _ = require('underscore')
const path = require('path')
const fs = require('fs-extra')
const figures = require('figures')
const chalk = require('chalk')

const success = figures(chalk.green('✔'))
const skip =  figures(chalk.yellow('✖'))
const fail =  figures(chalk.red('✖'))

exports.all = function(out, json) {
  exports.dirs(out)
  exports.assets(out)
  exports.html(out, json)
  exports.css(out, json)
  exports.js(out)
}

exports.dirs = function(out) {
  fs.ensureDirSync(out)
  fs.ensureDirSync(path.join(out, 'resized'))
}

exports.html = function(out, json) {
  const pug = require('pug')
  const buildpage = pug.compileFile(__dirname + '/pug/main.pug')

  const moment = require('moment')
  const markdownit = require('markdown-it')({breaks: true, linkify: true})
  const md = (text) => markdownit.renderInline(text || '').replace(/\r?\n|\r/g, '').replace(/<br><br>/g, '</p><p>')
  const resize = (img, w, h) => path.join('resized', exports.media(path.join(out, 'resized'), img, w, h))

  let pages = _.union(_.clone(json.portfolio), [
    {id: '404', title: json.flavor.error.title, summary: json.flavor.error.details},
    {id: 'index', welcome: true}
  ])

  for ( let page of pages ) {
    let html = buildpage({_: _, md: md, moment: moment, resize: resize, site: json, page: page})

    fs.outputFileSync(path.join(out, page.id + '.html'), html, 'utf8')
    console.log(`${success} Written ${page.id}.html`)
  }
}

exports.css = function(out, json) {
  const sass = require('sass')
  const sheets = ['main', 'noscript']

  for ( let sheet of sheets ) {
    let css = sass.renderSync({file: `${__dirname}/sass/${sheet}.scss`, outputStyle: 'compressed'}).css.toString('utf8')
    if (json.flavor.background)
      css = css.replace('header.jpg', json.flavor.background)

    fs.outputFileSync(path.join(out, sheet + '.css'), css)
    console.log(`${success} Written ${sheet}.css`)
  }
}

exports.js = function(out) {
  const uglify = require('uglify-js')
  const scripts = [
    'jquery.min', 'jquery.dropotron.min', 'jquery.scrolly.min', 'jquery.scrollex.min',
    'browser.min', 'breakpoints.min', 'svgxuse.min',
    'util', 'main'
  ]

  let js = _.reduce(scripts, (v, script) => v + fs.readFileSync(`${__dirname}/js/${script}.js`, 'utf-8') + '\n')
  let reduced = uglify.minify(js, '')
  if (!reduced.error)
    fs.outputFileSync(path.join(out, 'final.css'), reduced.code)

  console.log(reduced.error && `${fail} Failed to compress scripts.js` || `${success} Written scripts.js`)
}

exports.assets = function(out) {
  fs.readdirSync(__dirname + '/assets').forEach(file => {
    let input = `${__dirname}/assets/${file}`
    if (fs.statSync(input).isFile()) {
      fs.createReadStream(input).pipe(fs.createWriteStream(path.join(out, file)))
      console.log(`${success} Written ${file}`)
    }
  })
}

let lock = []
exports.media = function(out, filepath, width, height) {
  let ext = path.extname(filepath)
  let outname = require('crypto').createHash('md5').update(`${filepath}?${width}?${height}`).digest('hex') + ext
  let displayname = outname + chalk.gray(` (${filepath})`)
  let outpath = path.join(out, outname)

  if ( lock[outpath] ) {
    console.log(skip + ' Skipped ' + displayname)
  } else {
    lock[outpath] = true

    if ( ext == '.png' || ext == '.jpg' || ext == '.bmp' ) {
      require('jimp').read(filepath, (error, img) => {
        if (img)
          img.cover(width, height).write(outpath, error => {
            console.log((error && `${fail} Failed ` || `${success} Written `) + displayname)
          })
      })

    } else if ( ext == '.webm' || ext == '.mp4' || ext == '.ogg' ) {
      const ffmpeg = require('@ffmpeg-installer/ffmpeg')
      const spawn = require('child_process').spawn

      let cmd = spawn(ffmpeg.path, [
        '-i',  filepath,
        '-vf', 'scale=' + width + ':' + height + ':force_original_aspect_ratio=increase,crop=' + width + ':' + height,
        '-an',
        outpath
      ])

      cmd.stderr.on('data', data => cmd.stdin.write('y\n'))
      cmd.on('exit', code => console.log((code != 0 && `${fail} Failed ` || `${success} Written `) + displayname))

    } else {
      console.log(`${fail} ${filepath} is not a supported image or video file format.`)
    }
  }

  return outname
}
