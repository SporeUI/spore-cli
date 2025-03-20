import $path from 'path';
import $chalk from 'chalk';
import $fse from 'fs-extra';
import $execa from 'execa';
import $del from 'del';
import $download from 'download';
import $tar from 'tar';
import $lodash from 'lodash';
import Spore from './spore';
import $logger from './logger';
import {
  getTgz,
  getTgzName,
} from './util';
import {
  PATH_ENGINE,
} from './constants';

export interface TypePackage {
  name: string;
  version?: string;
}

export default class Engine {
  public core: Spore;

  public constructor(inst: Spore) {
    this.core = inst;
  }

  public getEngineRoot() {
    const { core } = this;
    const  { config } = core;
    const storeRoot = config.getStoreRoot();
    return $path.join(storeRoot, PATH_ENGINE);
  }

  public getEngineDir(fullName: string): string {
    const info = this.parseName(fullName);
    const { name, version } = info;
    const engineRoot = this.getEngineRoot();
    let dir = $path.join(engineRoot, name);
    if (version && version !== 'latest') {
      dir = $path.join(engineRoot, fullName);
    }
    return dir;
  }

  public getPkgDir(fullName: string): string {
    const dir = this.getEngineDir(fullName);
    return $path.join(dir, 'package');
  }

  public getPkgFile(fullName: string): string {
    const pkgDir = this.getPkgDir(fullName);
    return $path.join(pkgDir, 'package.json');
  }

  public engineExists(fullName: string): boolean {
    const pkgFile = this.getPkgFile(fullName);
    return $fse.existsSync(pkgFile);
  }

  public async getEngineEntry(fullName: string): Promise<string> {
    const pkgFile = this.getPkgFile(fullName);
    const pkgDir = this.getPkgDir(fullName);
    const json = await $fse.readJSON(pkgFile, 'utf8');
    const main = `${json.main}` || 'index.js';
    return $path.join(pkgDir, main);
  }

  public async installDependencies(fullName: string): Promise<void> {
    const pkgDir = this.getPkgDir(fullName);
    try {
      await $execa('npm', [
        'install',
      ], {
        stdio: 'inherit',
        cwd: pkgDir,
      });
    } catch (err) {
      $logger.error(`Engine ${$chalk.yellow(fullName)} install failed:`, err);
      return;
    }
    $logger.success(`Engine ${$chalk.yellow(fullName)} install success.`);
  }

  public parseName(fullName: string): TypePackage {
    const arr = fullName.split(/(?!^@)@/);
    const [name = '', version = ''] = arr;
    const info: TypePackage = {
      name,
      version,
    };
    return info;
  }

  // 下载 engine package
  public async download(fullName: string, tgzPath: string): Promise<void> {
    const { core } = this;
    const dir = this.getEngineDir(fullName);
    $logger.info(`Download package ${$chalk.yellow(fullName)} tgz:`, tgzPath);
    try {
      await $download(tgzPath, dir);
      const tgzFileName = getTgzName(tgzPath);
      core.verbose('download tgzFileName:', tgzFileName);
      const tgzFile = $path.join(dir, tgzFileName);
      core.verbose('download tgzFile:', tgzFile);
      await $tar.x({
        file: tgzFile,
        cwd: dir,
      });
    } catch (err) {
      $logger.error(`Package ${$chalk.yellow(fullName)} download error:`, err);
    }
    $logger.success(`Package ${$chalk.yellow(fullName)} downloaded.`);
  }

  public async getEngineList(): Promise<string[]> {
    const engineRoot = this.getEngineRoot();
    await $fse.ensureDir(engineRoot);
    const dirs = await $fse.readdir(engineRoot);
    const prvDirs = [];
    const pkgDirs = dirs.filter((name) => {
      if (name.indexOf('@') === 0) {
        prvDirs.push(name);
        return false;
      }
      return true;
    });
    const prvPkgPms = prvDirs.map(async (prvName) => {
      const prvDir = $path.join(engineRoot, prvName);
      const insideDirs = await $fse.readdir(prvDir);
      return insideDirs.map(dir => `${prvName}/${dir}`);
    });
    const prvPkgInfo = await Promise.all(prvPkgPms);
    const prvPkgDirs = $lodash.flatten(prvPkgInfo);
    const allPkgDirs = pkgDirs.concat(prvPkgDirs);
    return allPkgDirs;
  }

  // 安装 engine package 到指定路径
  public async load(fullName: string): Promise<void> {
    const { core } = this;
    const dir = this.getEngineDir(fullName);
    await $fse.ensureDir(dir);
    $logger.info(`Engine ${$chalk.yellow(fullName)} dir:`, dir);
    const tgzPath = await getTgz(fullName);
    core.verbose('load tgzPath:', tgzPath);
    if (!tgzPath) {
      $logger.error(`Package ${$chalk.yellow(fullName)} is not exists.`);
      return;
    }
    await this.download(fullName, tgzPath);
    await this.installDependencies(fullName);
  }

  // 控制台安装引擎
  public async install(fullName: string): Promise<void> {
    const { core } = this;
    core.verbose('engine install fullName:', fullName);

    const info = this.parseName(fullName);
    const dir = this.getEngineDir(fullName);
    const { name, version } = info;

    core.verbose('install fullName:', fullName);
    core.verbose('install name:', name);
    core.verbose('install version:', version);

    let engineName = name;
    if (version && version !== 'latest') {
      engineName = `${name}@${version}`;
    }

    core.verbose('install engineName:', engineName);

    // 默认先校验引擎是否存在
    if (this.engineExists(engineName)) {
      if (version === 'latest') {
        // 传入 engine@latest, 开启更新流程
        await $del([dir], {
          force: true,
        });
        $logger.info(`Engine ${$chalk.yellow(engineName)} updating ...`);
      } else {
        $logger.info(`Engine ${$chalk.yellow(engineName)} exists`);
        return;
      }
    }

    await this.load(engineName);
  }

  // 控制台移除引擎
  public async remove(fullName: string): Promise<void> {
    const { core } = this;
    core.verbose('engine remove fullName:', fullName);

    const dir = this.getEngineDir(fullName);
    core.verbose('remove dir:', dir);

    if ($fse.existsSync(dir)) {
      await $del([dir], {
        force: true,
      });
      $logger.success(`Engine ${$chalk.yellow(fullName)} removed`);
      return;
    }
    $logger.warn(`Engine ${$chalk.magenta(fullName)} is not exists`);
  }

  // 控制台呈现引擎列表
  public async list(): Promise<void> {
    const allPkgDirs = await this.getEngineList();
    if (allPkgDirs.length <= 0) {
      $logger.info('Engine list is empty');
      return;
    }
    allPkgDirs.forEach((dir) => {
      $logger.info(`- ${dir}`);
    });
  }
}
