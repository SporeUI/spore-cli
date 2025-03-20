import $path from 'path';
import $lodash from 'lodash';
import $chalk from 'chalk';
import $fse from 'fs-extra';
import $nodemon from 'nodemon';
import $prompts from 'prompts';
import $fkill from 'fkill';

import Config from './config';
import Engine from './engine';
import Template from './template';
import $logger from './logger';
import {
  cwd,
  copy,
  probe,
} from './util';

export interface TypeSporeOptions {
  cwd?: string;
  verbose?: boolean;
  [key: string]: unknown;
};

export interface TypeCreateOptions {
  dir?: string;
  template?: string;
}

export interface TypeRegisterOptions {
  description?: string;
  port?: number;
}

export interface TypeScriptItem extends TypeRegisterOptions {
  name?: string;
  handler?: () => void | Promise<void>;
}

export interface TypeEngineScripts {
  [key: string]: TypeScriptItem;
}

export default class Spore {
  public config: Config;
  public engine: Engine;
  public template: Template;
  public options: TypeSporeOptions;
  public engineScripts: TypeEngineScripts;
  public logger: typeof $logger;

  public constructor() {
    this.setOptions();
    this.config = new Config(this);
    this.engine = new Engine(this);
    this.template = new Template(this);
    this.engineScripts = {};
    this.logger = $logger;
  }

  public setOptions(options?: TypeSporeOptions) {
    this.options = {
      cwd: '',
      verbose: false,
      ...options,
    };
  }

  public verbose(...args) {
    const { options } = this;
    if (options.verbose) {
      $logger.verbose(...args);
    }
  }

  // 获取当前项目环境下使用的 engine
  public async getCurEngine(): Promise<string> {
    const root = this.cwd('.');
    const packageJsonFile = $path.join(root, 'package.json');
    let engineName = '';
    try {
      const pkg = await $fse.readJSON(packageJsonFile);
      engineName = pkg.sporeEngine || '';
    } catch (err) {
      engineName = '';
    }
    return engineName;
  }

  // 准备模板引擎
  public async prepareEngine(dir: string): Promise<void> {
    const { engine } = this;
    const appPath = this.cwd(dir);
    const appPackageFile = $path.join(appPath, 'package.json');
    if ($fse.existsSync(appPackageFile)) {
      const appPackage = await $fse.readJSON(appPackageFile);
      if (appPackage.sporeEngine) {
        engine.install(appPackage.sporeEngine);
      }
    }
  }

  // 从指定模板复制文件
  public async copyFiles(dir: string, tplName: string): Promise<void> {
    const { template } = this;
    if (!tplName) return;
    const appPath = this.cwd(dir);
    const tplLocal = template.getLocal(tplName);
    const copyFiles = await copy([
      `${tplLocal}/**/*`,
      `${tplLocal}/**/.*`,
      `!${tplLocal}/.git`,
    ], appPath);
    $logger.success(`App created at ${dir}`);

    const filesInfo = copyFiles
      .map(glob => glob.dest)
      .join('\n');
    this.verbose(`copy files: \n${filesInfo}`);
  }

  public nodemon(...args) {
    return $nodemon.apply($nodemon, args);
  }

  public cwd(dir: string): string {
    if (this.options.cwd) {
      return $path.join(this.options.cwd, dir);
    }
    return cwd(dir);
  }

  // 注册可用的命令
  public register(
    name: string,
    handler: () => void,
    options: TypeRegisterOptions,
  ) {
    const scriptItem: TypeScriptItem = {
      name,
      description: '',
      ...options,
    };
    scriptItem.handler = handler;
    this.engineScripts[name] = scriptItem;
  }

  // 加载引擎工厂函数
  public async loadFactory(engineName: string): Promise<void> {
    const { engine } = this;
    let factory = null;
    try {
      const entry = await engine.getEngineEntry(engineName);
      this.verbose('entry:', entry);
      const mod = await import(entry);
      if (typeof mod === 'function') {
        factory = mod;
      } else if (typeof mod.default === 'function') {
        factory = mod.default;
      }
      if (typeof factory !== 'function') {
        $logger.error(`Engine ${engineName} is not available`);
        return;
      }
      factory(this);
    } catch (err) {
      console.error(err);
      $logger.error(`Engine ${engineName} init failed`);
      return;
    }
  }

  // 从项目目录加载目标引擎
  public async loadEngine(): Promise<boolean> {
    const { engine } = this;
    const engineName = await this.getCurEngine();
    if (!engineName) {
      $logger.error('Can not find an engine');
      return false;
    }

    const info = engine.parseName(engineName);
    const { name, version } = info;
    if (name) {
      if (version === 'latest') {
        $logger.warn(`Should install ${engineName} manual`);
      } else {
        await engine.install(engineName);
      }
      await this.loadFactory(engineName);
    }

    return true;
  }

  // 检查端口占用
  public async checkPort(port: number): Promise<boolean> {
    const canUsePort = await probe(port);
    if (canUsePort) {
      $logger.success(`Port [${$chalk.yellow(port)}] is available.`);
      return true;
    }
    const msgInUse = [];
    msgInUse.push(`Port [${$chalk.yellow(port)}] is in use.`);
    msgInUse.push(`${$chalk.red('Kill the running service on')} port:${$chalk.yellow(port)} ?`);
    const overRs = await $prompts({
      type: 'confirm',
      name: 'killPort',
      message: msgInUse.join('\n'),
      initial: false,
    });
    if (overRs.killPort) {
      await $fkill(`:${port}`, {
        force: true,
        tree: true,
        silent: true,
      });
      $logger.success(`Port [${$chalk.yellow(port)}] cleaned`);
    } else {
      return false;
    }
    return true;
  }

  // 控制台执行创建 app 的指令
  public async create(options: TypeCreateOptions): Promise<void> {
    this.verbose('create options:', options);
    const {
      config,
      template,
    } = this;
    const conf: TypeCreateOptions = $lodash.defaults(options, {
      dir: config.getVal('create.dir'),
      template: config.getVal('template.default'),
    });

    const appPath = this.cwd(conf.dir);
    const tplTagName = `[${$chalk.yellow(conf.template)}]`;
    const tplRemote = template.getRemote(conf.template);

    if (!tplRemote) {
      $logger.error(`Template ${tplTagName} is not exists`);
      return;
    }

    $logger.info(`create app at ${appPath}`);
    $logger.info(`use template: ${tplTagName}`);

    await template.cache(conf.template);
    await this.copyFiles(conf.dir, conf.template);
    await this.prepareEngine(conf.dir);
  }

  // 控制台运行引擎注册的命令
  public async run(name: string): Promise<void> {
    this.verbose('run name:', name);
    const engineReady = await this.loadEngine();
    if (!engineReady) return;
    const scriptItem = this.engineScripts[name];
    const tagName = $chalk.yellow(name);
    if (!scriptItem) {
      $logger.error(`Script ${tagName} is not exists`);
      return;
    }
    if (typeof scriptItem.handler !== 'function') {
      $logger.error(`Script ${tagName} handler not registered`);
      return;
    }
    $logger.info(`Run script ${tagName}:`);
    if (scriptItem.port) {
      const portOk = await this.checkPort(scriptItem.port);
      if (!portOk) {
        $logger.fail(`Run script ${tagName} abort!`);
        return;
      }
    }
    const rs = scriptItem.handler();
    if (rs instanceof Promise) {
      await rs;
    }
  }

  // 控制台列举可执行的引擎命令
  public async list(): Promise<void> {
    this.verbose('spore run list');
    const engineReady = await this.loadEngine();
    if (!engineReady) return;
    const engineName = await this.getCurEngine();
    const allKeys = Object.keys(this.engineScripts);
    if (allKeys.length <= 0) {
      $logger.warn(`Engine ${engineName} not register any scripts`);
      return;
    }
    allKeys.forEach((name) => {
      const scriptItem = this.engineScripts[name];
      $logger.info(`- [${$chalk.yellow(scriptItem.name)}]:`, scriptItem.description);
    });
  }
}
