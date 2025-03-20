import $logger from 'colorogger';

const logger = new $logger({
  meta: {
    module: 'spore',
  },
});

logger.method('verbose', {
  level: 'info',
  flag: 'verbose',
});

logger.theme({
  icons: {
    verbose: {
      icon: 'v',
      color: '#ff9501',
    },
  },
});

export default logger;
