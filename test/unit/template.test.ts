import $path from 'path';
import $chalk from 'chalk';
import $fse from 'fs-extra';
import $git from 'simple-git';
import {
  delay,
} from '@spore-ui/tskit';
import $spore from '../kit/spore';
import $logger from '../../src/logger';
import $mockGit from '../mock/git';

jest.mock('simple-git');
const gitMock = $git as any;
gitMock.mockImplementation($mockGit);

jest.mock('../../src/logger');

describe('template', () => {
  test('设置一个模板', async () => {
    let logCount = 0;
    const pmWaitLog = new Promise((resolve) => {
      $logger.info = jest.fn((arg) => {
        const str = `${arg}`;
        logCount += 1;
        if (str.indexOf($chalk.yellow('demo')) >= 0) {
          resolve(null);
        }
      });
    });
    const gitPath = 'https://github.com/SporeUI/spore-template-test.git';
    await $spore.template.set('demo', gitPath);
    await pmWaitLog;
    expect(logCount).toBeGreaterThan(0);
    expect($spore.template.data.demo).toBe(gitPath);
  });

  test('列举模板', async () => {
    let logCount = 0;
    const pmWaitLog = new Promise((resolve) => {
      $logger.info = jest.fn((arg) => {
        const str = `${arg}`;
        logCount += 1;
        if (str.indexOf($chalk.yellow('demo')) >= 0) {
          resolve(null);
        }
      });
    });
    await $spore.template.list();
    await pmWaitLog;
    expect(logCount).toBeGreaterThan(0);
  });

  test('缓存模板', async () => {
    await delay(10);
    const gitPath = 'https://github.com/SporeUI/spore-template-test.git';
    await $spore.template.remove('demo');
    await delay(10);
    await $spore.template.set('demo', gitPath);
    await $spore.template.cache('demo');
    const tplRoot = $spore.template.getTemplateRoot();
    const tplLocal = $path.join(tplRoot, 'demo');
    const tplLocalPkg = $path.join(tplLocal, 'package.json');
    expect($fse.existsSync(tplLocal)).toBeTruthy();
    expect($fse.existsSync(tplLocalPkg)).toBeTruthy();
  });

  test('移除模板', async () => {
    await delay(10);
    const gitPath = 'https://github.com/SporeUI/spore-template-test.git';
    await $spore.template.set('mock', gitPath);
    await $spore.template.cache('mock');

    await delay(10);
    await $spore.template.remove('mock');

    await delay(10);
    const tplRoot = $spore.template.getTemplateRoot();
    const tplLocal = $path.join(tplRoot, 'mock');
    expect($spore.template.data.mock).toBeUndefined();
    expect($fse.existsSync(tplLocal)).toBeFalsy();
  });
});
