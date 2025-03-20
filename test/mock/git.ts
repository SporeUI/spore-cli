import $fse from 'fs-extra';
import {
  copy,
  resolve,
} from '../../src/util';

async function copyFilesTo(local: string): Promise<void> {
  const mockDir = resolve('test/mock/template');
  console.log('mock template dir:', mockDir);
  await $fse.ensureDir(local);
  try {
    console.log('copy mock template files to dir:', local);
    await copy([
      `${mockDir}/*`,
      `${mockDir}/**/*`,
    ], local);
  } catch (err) {
    console.error(err);
  }
}

const mockGit = (root) => {
  console.log('mock git root:', root);
  const inst = {
    async clone(remote: string, local: string): Promise<void> {
      console.log('mock git clone', remote, local);
      if (remote.indexOf('spore-template-test') < 0) return;
      await copyFilesTo(local);
    },
    async pull() {
      console.log('mock git pull');
      if (root) {
        await copyFilesTo(root);
      }
    },
  };
  return inst;
};

export default mockGit;
