import $chalk from 'chalk';
import $spore from '../kit/spore';
import $logger from '../../src/logger';

jest.mock('../../src/logger');

function getColorProp() {
  const colorKey = $chalk.magenta('store.path');
  const colorVal = $chalk.yellow('.spore');
  const colorProp = `${colorKey}="${colorVal}"`;
  return colorProp;
}

describe('config', () => {
  test('默认选项已存在', () => {
    const { config } = $spore;
    const createDir = config.getVal('create.dir');
    const templateDefault = config.getVal('template.default');
    const storePath = config.getVal('store.path');
    expect(createDir).toBe('app');
    expect(templateDefault).toBe('');
    expect(storePath).toBe('.spore');
  });

  test('获取一条配置', (done) => {
    const { config } = $spore;
    $logger.info = jest.fn((str) => {
      const colorProp = getColorProp();
      expect(str).toEqual(expect.stringContaining(`[${colorProp}]`));
      done();
    });
    config.get('store.path');
  });

  test('获取所有配置', (done) => {
    const { config } = $spore;
    $logger.info = jest.fn((str) => {
      if ((`${str}`).indexOf('store') >= 0) {
        const colorProp = getColorProp();
        expect(str).toEqual(expect.stringContaining(`[${colorProp}]`));
        done();
      }
    });
    config.list();
  });

  test('设置一条配置，移除配置等价于还原默认配置', async () => {
    $logger.info = jest.fn();
    const { config } = $spore;
    let createDir = config.getVal('create.dir');
    expect(createDir).toBe('app');

    await config.set('create.dir', 'spp');
    createDir = config.getVal('create.dir');
    expect(createDir).toBe('spp');

    await config.remove('create.dir');
    createDir = config.getVal('create.dir');
    expect(createDir).toBe('app');
  });
});
