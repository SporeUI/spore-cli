import $path from 'path';
import $fse from 'fs-extra';
import $del from 'del';
import $git from 'simple-git';
import $download from 'download';
import $execa from 'execa';
import {
  delay,
} from '@spore-ui/tskit';

import $spore from '../kit/spore';
import {
  cwd,
} from '../../src/util';
import $mockGit from '../mock/git';
import $mockDownload from '../mock/download';
import $mockExeca from '../mock/execa';

jest.mock('simple-git');
jest.mock('download');
jest.mock('tar');
jest.mock('execa');

const gitMock = $git as any;
gitMock.mockImplementation($mockGit);

const downMock = $download as any;
downMock.mockImplementation($mockDownload);

const execaMock = $execa as any;
execaMock.mockImplementation($mockExeca);

jest.mock('../../src/logger');

describe('spore', () => {
  test('用不存在的模板创建项目', async () => {
    const expectAppPath = cwd('app');
    await $del([expectAppPath], {
      force: true,
    });
    await delay(10);
    await $spore.create({
      dir: 'app',
      template: 'none',
    });
    expect($fse.existsSync(expectAppPath)).toBeFalsy();
  });

  test('创建一个项目', async () => {
    await delay(10);
    const gitPath = 'https://github.com/spore-ui/spore-template-test.git';
    await $spore.template.set('test', gitPath);
    await $spore.create({
      dir: 'app',
      template: 'test',
    });
    const expectAppPath = cwd('app');
    const expectPkgPath = $path.join(expectAppPath, 'package.json');
    const json = $fse.readJSONSync(expectPkgPath);
    expect(json.name).toBe('@spore-ui/spore-template-test');
  });

  test('在非项目环境，无法执行引擎脚本', async () => {
    await $spore.list();
    const keys = Object.keys($spore.engineScripts);
    expect(keys.length).toBe(0);
  });

  test('验证引擎脚本注册', async () => {
    $spore.setOptions({
      cwd: $spore.cwd('app'),
    });
    await $spore.list();
    $spore.setOptions({
      cwd: '',
    });
    expect(typeof $spore.engineScripts.serve.handler).toBe('function');
    expect(typeof $spore.engineScripts.build.handler).toBe('function');
  });

  test('验证引擎脚本执行', async () => {
    $spore.setOptions({
      cwd: $path.join(process.cwd(), 'app'),
    });
    await $spore.run('build');
    $spore.setOptions({
      cwd: '',
    });
    expect(typeof $spore.engineScripts.build.handler).toBe('function');
    const val = $spore.config.getVal('engine.test');
    expect(val).toBe('spore-engine-test');
  });
});
