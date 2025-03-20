import $path from 'path';
import $fse from 'fs-extra';
import {
  copy,
  resolve,
} from '../../src/util';

async function copyFilesTo(local: string): Promise<void> {
  const mockDir = resolve('test/mock/engine');
  console.log('mock engine dir:', mockDir);
  await $fse.ensureDir(local);
  const pkgDir = $path.join(local, 'package');
  const depFile = $path.join(pkgDir, 'node_modules/lodash/index.js');
  await $fse.ensureFile(depFile);
  try {
    console.log('copy mock engine files to dir:', pkgDir);
    await copy([
      `${mockDir}/*`,
      `${mockDir}/**/*`,
    ], pkgDir);
  } catch (err) {
    console.error(err);
  }
}

async function mockDownload(remote: string, local: string): Promise<void> {
  console.log('mock download remote:', remote, 'local:', local);
  if (remote.indexOf('spore-engine-test') < 0) return;
  await copyFilesTo(local);
};

export default mockDownload;
