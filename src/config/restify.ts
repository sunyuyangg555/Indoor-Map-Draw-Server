import * as fs from 'fs';
import * as restify from 'restify';
import * as path from 'path';
import { config } from './config';
import { logger } from '../utils/logger';

// get path to route handlers
const pathToRoutes: string = path.join(config.root, '/routes');

// create Restify server with the configured name
const app: restify.Server = restify.createServer({ name: config.name, });

// parse the body of the request into req.params
app.use(restify.plugins.bodyParser({ mapParams: false, }));
app.use(restify.plugins.acceptParser(app.acceptable));
app.use(restify.plugins.authorizationParser());
app.use(restify.plugins.dateParser());
app.use(restify.plugins.queryParser());
app.use(restify.plugins.urlEncodedBodyParser());


// user-defined middleware
app.use((req: any, res: any, next: any) => {
  // Set permissive CORS header - this allows this server to be used only as
  // an API server in conjunction with something like webpack-dev-server.
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  
  // disable caching so we'll always get the latest data
  res.header('Cache-Control', 'no-cache');

  // log the request method and url
  logger.info(`请求：${req.method} ${req.url}`);

  // log the request body
  logger.info(`参数: ${JSON.stringify(req.params)}`);

  return next();
});

// add route handlers
fs.readdir(pathToRoutes, (err: any, files: string[]) => {
  if (err) {
    throw new Error(err);
  } else {
    files.filter((file: string) => path.extname(file) === '.js')
      .forEach((file: string) => {
        const route = require(path.join(pathToRoutes, file));
        route.default(app);
      });
  }
});

export { app };
