import $path from 'path';
import $os from 'os';
import $chalk from 'chalk';
import $fse from 'fs-extra';
import Spore from './spore';
import $logger from './logger';
import $defaults, { desc } from './defaultConfig';

export interface TypeConfigObject {
  [key: string]: string;
}

export default class Config {
  public core: Spore;
  public data: TypeConfigObject;

  public constructor(inst: Spore) {
    this.core = inst;
    this.data = {};
    this.load();
  }

  public getStoreRoot(): string {
    const home = $os.homedir();
    const storePath = this.getVal('store.path') as string;
    return $path.join(home, storePath);
  }

  public getConfigPath(): string {
    const storeRoot = this.getStoreRoot();
    const configPath = $path.join(storeRoot, 'config.json');
    return configPath;
  }

  public load() {
    const { core } = this;
    const data = {};
    const configPath = this.getConfigPath();
    if ($fse.existsSync(configPath)) {
      const json = $fse.readJSONSync(configPath);
      Object.assign(data, json);
    }
    core.verbose('load config from:', configPath);
    this.data = data;
  }

  public async save(): Promise<void> {
    const { data, core } = this;
    const configPath = this.getConfigPath();
    await $fse.ensureFile(configPath);
    await $fse.writeJSON(configPath, data, 'utf8');
    core.verbose('config save to:', configPath);
  }

  public async setVal(key: string, val: string) {
    const { data } = this;
    if (val) {
      data[key] = val;
    }
    await this.save();
  }

  public getVal(key: string): string {
    const { data } = this;
    let val = data[key] || '';
    if (!val) {
      val = $defaults[key];
    }
    return val;
  }

  public async removeVal(key: string): Promise<void> {
    const { data } = this;
    delete data[key];
    await this.save();
  }

  // 控制台设置一项配置
  public async set(key: string, val: string): Promise<void> {
    const { core } = this;
    core.verbose('config set key:', key, 'val:', val);
    await this.setVal(key, val);
    this.get(key);
  }

  // 控制台显示一项配置
  public get(key: string): void {
    let val = this.getVal(key);
    if (!val) {
      val = '';
    }
    const strKey = $chalk.magenta(key);
    const strVal = $chalk.yellow(val);
    const strProp = `${strKey}="${strVal}"`;
    let strDesc = '';
    if (desc[key]) {
      strDesc =  $chalk.green(` # ${desc[key]}`);
    }
    const str = `- [${strProp}]${strDesc}`;
    $logger.info(str);
  }

  // 控制台移除一项配置
  public async remove(key: string): Promise<void> {
    const { core } = this;
    core.verbose('config remove key:', key);
    await this.removeVal(key);
    this.get(key);
  }

  // 控制台列举所有配置
  public list(): void {
    const { data } = this;
    const allConfig = {
      ...$defaults,
      ...data,
    };
    Object.keys(allConfig).forEach((key) => {
      this.get(key);
    });
  }
}
