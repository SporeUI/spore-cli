import {
  TypePlainObject,
} from '../../src/types';

function mockExeca(cmd: string, args: string[]): Promise<TypePlainObject> {
  console.log('mock execa cmd:', cmd, 'args:', args);
  const info: TypePlainObject = {};
  if (
    Array.isArray(args)
    && args[0] === 'view'
    && args[2].indexOf('spore-engine-test') >= 0
  ) {
    const tgzPath = 'https://npmjs.org/@spore-ui/spore-engine-test/-/@spore-ui/spore-engine-test-0.1.1.tgz';
    info.dist = {
      tarball: tgzPath,
    };
  }
  const rs: TypePlainObject = {};
  rs.stdout = JSON.stringify(info);
  return Promise.resolve(rs);
};

export default mockExeca;
