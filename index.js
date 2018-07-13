const fs = require('fs')
const path = require('path')
const _ = require('underscore')

const success = '\x1b[32m√\x1b[0m '
const fail = '\x1b[31m×\x1b[0m '
const skip = '\x1b[33m×\x1b[0m '

exports.html = function(out, json) {
  const pug = require('pug')
  const buildpage = pug.compileFile('pug/main.pug')

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

    fs.writeFileSync(path.join(out, page.id + '.html'), html, 'utf8')
    console.log(success + 'Written ' + page.id + '.html')
  }
}

exports.css = function(out, json) {
  const sass = require('sass')
  const sheets = ['main', 'noscript']

  for ( let sheet of sheets ) {
    let css = sass.renderSync({file: 'sass/' + sheet + '.scss', outputStyle: 'compressed'}).css.toString('utf8')
    if (json.flavor.background)
      css = css.replace('header.jpg', json.flavor.background)

    fs.writeFileSync(path.join(out, sheet + '.css'), css)
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

let lock = []
exports.media = function(out, filepath, width, height) {
  const crypto = require('crypto')

  let ext = path.extname(filepath)
  let outname = crypto.createHash('md5').update(filepath + '?' + width + '?' + height).digest('hex') + ext
  let displayname = outname + ' (' + filepath + ')'
  let outpath = path.join(out, outname)

  if ( lock[outpath] ) {
    console.log(skip + 'skipped ' + displayname)
  } else {
    lock[outpath] = true

    if ( ext == '.png' || ext == '.jpg' || ext == '.bmp' ) {
      require('jimp').read(filepath, (error, img) => {
        if (img)
          img.cover(width, height).write(outpath, error => {
            console.log((error && (fail + 'Failed ') || (success + 'Written ')) + displayname)
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
      cmd.on('exit', code => console.log((code != 0 && (fail + 'Failed ') || (success + 'Written ')) + displayname))

    } else {
      console.log(error + filepath + ' is not a supported image or video file format.')
    }
  }

  return outname
}
