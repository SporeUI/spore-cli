import $path from 'path';
import $chalk from 'chalk';
import $fse from 'fs-extra';
import $del from 'del';
import $git from 'simple-git';
import Spore from './spore';
import $logger from './logger';
import {
  PATH_TEMPLATE,
} from './constants';

export interface TypeTemplateObject {
  [key: string]: string;
}

export default class Template {
  public core: Spore;
  public data: TypeTemplateObject;

  public constructor(inst: Spore) {
    this.core = inst;
    this.data = {};
    this.load();
  }

  public getTemplateConfigPath(): string {
    const { core } = this;
    const storeRoot = core.config.getStoreRoot();
    return $path.join(storeRoot, 'template.json');
  }

  public getTemplateRoot() {
    const { core } = this;
    const  { config } = core;
    const storeRoot = config.getStoreRoot();
    return $path.join(storeRoot, PATH_TEMPLATE);
  }

  public load() {
    const { core } = this;
    const data = {};
    const tdataPath = this.getTemplateConfigPath();
    if ($fse.existsSync(tdataPath)) {
      let json = {};
      try {
        json = $fse.readJSONSync(tdataPath);
      } catch (err) {
        json = {};
      }
      Object.assign(data, json);
    }
    core.verbose('load config from:', tdataPath);
    this.data = data;
  }

  public async save(): Promise<void> {
    const { data, core } = this;
    const tdataPath = this.getTemplateConfigPath();
    await $fse.ensureFile(tdataPath);
    await $fse.writeJSON(tdataPath, data, 'utf8');
    core.verbose('template info save to:', tdataPath);
  }

  // 获取模板远程路径
  public getRemote(name: string): string {
    return this.data[name] || '';
  }

  // 获取模板的本地路径
  public getLocal(tplName: string): string {
    const dirTplRoot = this.getTemplateRoot();
    return $path.join(dirTplRoot, tplName);
  }

  // 缓存模板
  public async cache(name: string): Promise<void> {
    const tplRemote = this.getRemote(name);
    const tplTagName = `[${$chalk.yellow(name)}]`;
    if (!tplRemote) {
      $logger.error(`Template ${tplTagName} is not exists`);
      return;
    }

    const tplLocal = this.getLocal(name);
    const gitDir = $path.join(tplLocal, '.git');
    const tplDirExists = await $fse.pathExists(tplLocal);
    const tplGitExists = await $fse.pathExists(gitDir);

    let cached = true;
    if (!tplDirExists) {
      cached = false;
    }
    if (!tplGitExists) {
      await $del([tplLocal], {
        force: true,
      });
      cached = false;
    }

    if (!cached) {
      // clone template to cache dir
      await $git().clone(tplRemote, tplLocal);
      $logger.success(`Template ${tplTagName} cached`);
    }

    if (tplGitExists) {
      // git pull template
      await $git(tplLocal).pull();
      $logger.success(`Template ${tplTagName} updated`);
    }
  }

  // 控制台呈现一条模板信息
  public get(name: string): void {
    const src = this.getRemote(name);
    const strProp = $chalk.yellow(name);
    const str = `- [${strProp}]: ${src}`;
    $logger.info(str);
  }

  // 控制台设置一项模板
  public async set(name: string, src: string): Promise<void> {
    const { core } = this;
    core.verbose('template set name:', name, 'src:', src);
    this.data[name] = src;
    await this.save();
    this.get(name);
  }

  // 控制台移除一项模板
  public async remove(name: string): Promise<void> {
    const { core } = this;
    core.verbose('template remove name:', name);
    delete this.data[name];
    const tplLocal = this.getLocal(name);
    await $del([tplLocal], {
      force: true,
    });
    await this.save();
    this.get(name);
  }

  // 控制台列举模板
  public list(): void {
    const tpls = Object.keys(this.data);
    if (!tpls.length) {
      $logger.info('Template list is empty');
      return;
    }
    tpls.forEach((name) => {
      this.get(name);
    });
  }
};
