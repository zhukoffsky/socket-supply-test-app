import path from 'node:path'
import fs from 'node:fs/promises'

import esbuild from 'esbuild'

const cp = async (a, b) => fs.cp(
  path.resolve(a),
  path.join(b, path.basename(a)),
  { recursive: true, force: true }
)

async function copy (target) {
  //
  // Copy the rest of the files that we care about.
  //
  await cp('src/index.html', target)
  await cp('src/icon.png', target)
}

async function main (argv) {
  const params = {
    entryPoints: ['src/index.js'],
    format: 'esm',
    bundle: true,
    minify: false,
    sourcemap: true,
    external: ['socket:*', 'node:*'],
    keepNames: true
  }

  //
  // During development, this script will be started by npm and it
  // will be passed the target directory for the build artifacts.
  //
  // During a build, this script will be called by the `op` command.
  // In this case the target directory for the build artifacts will
  // be provided as the argument at index 2.
  //
  const watch = process.argv.find(s => s.includes('--watch='))
  const target = argv[0]

  if (!target) {
    console.log('Did not receive the build target path as an argument!')
    console.log('Add "[build.script] forward_arguments = true" to the socket.ini file.')
    process.exit(1)
  }

  if (watch) {
    esbuild.serve({ servedir: path.resolve(watch.split('=')[1]) }, params)
  }

  if (!watch) {
    const opts = {
      ...params,
      outdir: target,
      minifyWhitespace: false,
      minifyIdentifiers: true,
      minifySyntax: true
    }
    await esbuild.build(opts)
  }

  //
  // if this app had a backend we could build it here as well...
  //
  // await esbuild.build({ ...params, entryPoints: ['src/backend.js'], platform: 'node', format: 'cjs' })
  //

  //
  // Not writing a package json to your project could be a security risk
  //
  // await fs.writeFile(path.join(target, 'package.json'), '{ private: true }')

  await copy(target)
}

main(process.argv.slice(2))
