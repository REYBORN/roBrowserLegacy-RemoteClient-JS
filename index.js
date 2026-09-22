require('dotenv').config();

const http = require('http');
const path = require('path');
const logger = require('./src/utils/logger');
const StartupValidator = require('./src/validators/startupValidator');
const Client = require('./src/controllers/clientController');
const { createApp, resolveCorsOrigins } = require('./src/app');
const { attachWsProxy, parseAllowedTargets } = require('./src/wsProxy');

const port = process.env.PORT || 3338;
<<<<<<< HEAD
const host = process.env.HOST || '127.0.0.1';
const routes = require('./src/routes');
const debugMiddleware = require('./src/middlewares/debugMiddleware');
const createRawImportMiddleware = require('./src/middlewares/rawImportMiddleware');

=======
>>>>>>> cf105965e96341efd9195b3fc6864b1434d50cae
const CLIENT_PUBLIC_URL = process.env.CLIENT_PUBLIC_URL || 'http://localhost:8000';
const ENABLE_WSPROXY = process.env.ENABLE_WSPROXY === 'true';
const ENABLE_STATIC_SERVE = process.env.ENABLE_STATIC_SERVE === 'true';
const ESRGAN_ENABLED = process.env.ESRGAN_ENABLED === 'true';
const ESRGAN_CACHE_DIR = process.env.ESRGAN_CACHE_DIR || './upscaled_cache';
const ROBROWSER_PATH = process.env.ROBROWSER_PATH || '../roBrowserLegacy';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Load the optional ESRGAN plugin, or return null.
 *
 * Resolve before requiring: require.resolve() does not execute the module, so a MODULE_NOT_FOUND here
 * can only mean the plugin itself is absent. Loading it is then left unguarded on purpose -- a broken
 * install must surface as a real error, not be silently downgraded to "not installed".
 */
async function loadEsrgan() {
  let pluginPath = null;
  try {
    pluginPath = require.resolve('@chicowall/robrowser-esrgan');
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    logger.warn('ESRGAN_ENABLED is set but @chicowall/robrowser-esrgan is not installed.');
    logger.warn('Install it with: npm install github:FranciscoWallison/robrowser-esrgan');
    logger.warn('Continuing without upscaling.\n');
    return null;
  }

  const createEsrganMiddleware = require(pluginPath);
  const cachePath = path.resolve(__dirname, ESRGAN_CACHE_DIR);
  return createEsrganMiddleware({ cacheDir: cachePath, logger });
}

// Main startup function
async function startServer() {
  logger.info(`Starting roBrowser Remote Client... [${IS_PROD ? 'production' : 'development'}]\n`);

  // Build the GRF index concurrently with validation, as before -- but wait for it before listening.
  // It used to be fired from the routes module with nothing awaiting it, so the server could accept
  // requests while the index was still empty: those 404'd and were logged as permanently missing, and
  // a rejection escaped as an unhandled promise rejection.
  const indexReady = Client.init();
  // Handled below by the await; this only stops a rejection during validation from crashing the process
  // as unhandled before that await is reached.
  indexReady.catch(() => {});

  const validator = new StartupValidator();
  const results = await validator.validateAll();
  const validationStatus = validator.getStatusJSON();

  // Print report (verbose in dev, silent in prod unless errors)
  if (IS_PROD) {
    if (!results.success) {
      validator.printReport(results);
    }
  } else {
    validator.printReport(results);
  }

  // If there are fatal errors, exit
  if (!results.success) {
    logger.error('Server cannot start due to configuration errors.');
    logger.error('Run "npm run doctor" for a full diagnosis.\n');
    process.exit(1);
  }

<<<<<<< HEAD
  // Allow the XAMPP client from localhost and private LAN addresses. This lets
  // phones on the same network load game assets without opening the gateway to
  // arbitrary public web origins.
  const isAllowedClientOrigin = (origin) => {
    if (!origin) return true;
    if (origin === CLIENT_PUBLIC_URL) return true;
    try {
      const { protocol, hostname } = new URL(origin);
      if (!['http:', 'https:'].includes(protocol)) return false;
      return hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
    } catch {
      return false;
    }
  };

  const corsOptions = {
    origin(origin, callback) {
      const allowed = isAllowedClientOrigin(origin);
      callback(allowed ? null : new Error('Origin is not allowed'), allowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '16kb', strict: true }));
  app.use(express.urlencoded({ extended: true, limit: '16kb' }));
=======
  await indexReady;

  const esrganInstance = ESRGAN_ENABLED ? await loadEsrgan() : null;
>>>>>>> cf105965e96341efd9195b3fc6864b1434d50cae

  let staticRoot = null;
  if (ENABLE_STATIC_SERVE) {
    staticRoot = path.resolve(__dirname, ROBROWSER_PATH);
    logger.debug(`Static serve enabled: ${staticRoot}`);
  }

  const app = createApp({
    isProd: IS_PROD,
    corsOrigins: resolveCorsOrigins(process.env.CORS_ORIGINS, CLIENT_PUBLIC_URL),
    validationStatus,
    esrganInstance,
    staticRoot,
  });
  const server = http.createServer(app);

  if (ENABLE_WSPROXY) {
    attachWsProxy(server, { allowedTargets: parseAllowedTargets(process.env.WS_ALLOWED_TARGETS) });
  }

<<<<<<< HEAD
  server.listen(port, host, async () => {
    logger.info(`Server ready on http://${host}:${port}` +
=======
  server.listen(port, () => {
    logger.info(`Server ready on http://localhost:${port}` +
>>>>>>> cf105965e96341efd9195b3fc6864b1434d50cae
      (ENABLE_STATIC_SERVE ? ` | Game: http://localhost:${port}/applications/pwa/index.html` : '') +
      (ENABLE_WSPROXY ? ` | WS Proxy: /ws/` : ''));

    // Cache warm-up (runs after server is ready, non-blocking)
    if (process.env.CACHE_WARM_UP === 'true') {
      const warmLimit = parseInt(process.env.CACHE_WARM_UP_LIMIT) || 500;
      logger.debug(`Warming cache (up to ${warmLimit} files)...`);
      Client.warmCache([], warmLimit).catch((err) => {
        logger.error('Cache warm-up error:', err.message);
      });
    }
  });
}

// Start server
startServer().catch((error) => {
  logger.error('Fatal error while starting server:', error);
  process.exit(1);
});
