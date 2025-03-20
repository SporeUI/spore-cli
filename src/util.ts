import $path from 'path';
import $execa from 'execa';
import $copy from 'copy';
import { check } from 'port-used';

import {
  TypePlainObject,
} from './types';

const ROOT = $path.resolve(__dirname, '../');
export const cwd = dir => $path.join(process.cwd(), dir);
export const resolve = dir => $path.join(ROOT, dir);

export async function getTgz(fullName: string): Promise<string> {
  let tgzPath = '';
  try {
    const rs = await $execa('npm', [
      'view',
      '--json',
      fullName,
    ]);
    const json = JSON.parse(rs.stdout);
    tgzPath = json.dist.tarball;
  } catch (err) {
    tgzPath = '';
  }
  return tgzPath;
}

export function getTgzName(tgzPath: string): string {
  const arr = tgzPath.split('/');
  return arr.pop();
}

export interface TypeGlob {
  dest: string;
}

export function copy(
  src: string | string[],
  dest: string,
  options?: TypePlainObject,
): Promise<TypeGlob[]> {
  const opts = options || {};
  return new Promise((resolve, reject) => $copy(
    src,
    dest,
    opts,
    (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.map((file) => {
          const glob: TypeGlob = {
            dest: `${file}`,
          };
          return glob;
        }));
      }
    },
  ));
}

// 检测port是否被占用
export async function probe(port: number): Promise<boolean> {
  try {
    const inUse = await check(port, '127.0.0.1');
    return !inUse;
  } catch (err) {
    console.error('probe error:', err);
    return false;
  }
}
