import $path from 'path';
import $chalk from 'chalk';
import $fse from 'fs-extra';
import $download from 'download';
import $execa from 'execa';

import $spore from '../kit/spore';
import $logger from '../../src/logger';
import $mockDownload from '../mock/download';
import $mockExeca from '../mock/execa';

jest.mock('download');
jest.mock('tar');
jest.mock('execa');
jest.mock('../../src/logger');

const downMock = $download as any;
downMock.mockImplementation($mockDownload);

const execaMock = $execa as any;
execaMock.mockImplementation($mockExeca);

describe('engine', () => {
  test('引擎安装到指定位置', async () => {
    const engineRoot = $spore.engine.getEngineRoot();
    await $spore.engine.install('@spore-ui/spore-engine-test');
    const expectEngineDir = $path.join(engineRoot, '@spore-ui/spore-engine-test');
    const expectPkgFile = $path.join(expectEngineDir, 'package/package.json');
    const expectLodash = $path.join(expectEngineDir, 'package/node_modules/lodash');
    expect($fse.existsSync(expectEngineDir)).toBeTruthy();
    expect($fse.existsSync(expectPkgFile)).toBeTruthy();
    expect($fse.existsSync(expectLodash)).toBeTruthy();
  });

  test('移除引擎', async () => {
    const engineRoot = $spore.engine.getEngineRoot();
    await $spore.engine.install('@spore-ui/spore-engine-test@0.0.2');
    await $spore.engine.remove('@spore-ui/spore-engine-test@0.0.2');
    const expectEngineDir = $path.join(engineRoot, '@spore-ui/spore-engine-test@0.0.2');
    expect($fse.existsSync(expectEngineDir)).toBeFalsy();
  });

  test('安装并不存在的引擎', async () => {
    const pmWaitLog = new Promise((resolve) => {
      $logger.error = jest.fn((arg) => {
        const str = `${arg}`;
        if (str.indexOf('not exists') >= 0) {
          resolve(null);
        }
      });
    });
    const engineRoot = $spore.engine.getEngineRoot();
    await $spore.engine.install('spore-engine-none');
    const expectEngineDir = $path.join(engineRoot, 'spore-engine-none');
    const expectPkgFile = $path.join(expectEngineDir, 'package/package.json');
    await pmWaitLog;
    expect($fse.existsSync(expectEngineDir)).toBeTruthy();
    expect($fse.existsSync(expectPkgFile)).toBeFalsy();
  });

  test('更新引擎', async () => {
    const pmWaitLog = new Promise((resolve) => {
      $logger.info = jest.fn((arg) => {
        const str = `${arg}`;
        const expectStr = `Engine ${$chalk.yellow('@spore-ui/spore-engine-test')} updating`;
        if (str.indexOf(expectStr) >= 0) {
          resolve(null);
        }
      });
    });
    const engineRoot = $spore.engine.getEngineRoot();
    await $spore.engine.install('@spore-ui/spore-engine-test@latest');
    const expectEngineDir = $path.join(engineRoot, '@spore-ui/spore-engine-test');
    const latestEngineDir = $path.join(engineRoot, '@spore-ui/spore-engine-test@latest');
    const expectPkgFile = $path.join(expectEngineDir, 'package/package.json');
    await pmWaitLog;
    expect($fse.existsSync(expectEngineDir)).toBeTruthy();
    expect($fse.existsSync(latestEngineDir)).toBeFalsy();
    expect($fse.existsSync(expectPkgFile)).toBeTruthy();
  });

  test('安装指定版本引擎', async () => {
    const engineRoot = $spore.engine.getEngineRoot();
    await $spore.engine.install('@spore-ui/spore-engine-test@0.0.1');
    const expectEngineDir = $path.join(engineRoot, '@spore-ui/spore-engine-test@0.0.1');
    const expectPkgFile = $path.join(expectEngineDir, 'package/package.json');
    expect($fse.existsSync(expectEngineDir)).toBeTruthy();
    expect($fse.existsSync(expectPkgFile)).toBeTruthy();
  });

  test('获取引擎入口文件', async () => {
    const engineRoot = $spore.engine.getEngineRoot();
    const expectEngineDir = $path.join(engineRoot, '@spore-ui/spore-engine-test');
    const expectEngineEntry = $path.join(expectEngineDir, 'package/index.js');
    const entry = await $spore.engine.getEngineEntry('@spore-ui/spore-engine-test');
    expect(entry).toBe(expectEngineEntry);
  });

  test('获取引擎列表', async () => {
    let count = 0;
    const pmWaitLog = new Promise((resolve) => {
      $logger.info = jest.fn((arg) => {
        count += 1;
        const str = `${arg}`;
        const expectStr = '- @spore-ui/spore-engine-test';
        if (str.indexOf(expectStr) >= 0) {
          resolve(null);
        }
      });
    });
    await $spore.engine.list();
    await pmWaitLog;
    expect(count).toBeGreaterThan(1);
  });
});

