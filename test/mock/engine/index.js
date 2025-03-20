// spore facktory
function factory(spore) {
  spore.register('serve', () => {
    console.info('run serve script');
  }, {
    port: 8090,
    description: 'development serve'
  });

  spore.register('build', async () => {
    console.info('run build script');
    await spore.config.set('engine.test', 'spore-engine-test');
  }, {
    description: 'build app'
  });
}

module.exports = factory;
