import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import express from "express";
import { DataLoggerController } from "lib/DataLogger/Controller/DataLoggerController";
import * as jsonc from "jsonc-parser";
import * as fs from "fs";
import log4js from "log4js";

log4js.configure({
    appenders: {
        system: { type: 'console' }
    },
    categories: {
        default: { appenders: ['system'], level: 'debug' },
    }
});

const logger = log4js.getLogger();

const parameterCodeList: WebsocketParameterCode[] = [WebsocketParameterCode.Engine_Speed, WebsocketParameterCode.Manifold_Absolute_Pressure];
require('./server.appconfig.jsonc');

type AppConfig =
    {
        port: number
    };

const readAppConfig = (): AppConfig => jsonc.parse(fs.readFileSync("./config/server.appconfig.jsonc", "utf8"));

const run = async () => {
    const config = readAppConfig();

    const app = express();
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(express.json());

    const controller = new DataLoggerController();
    controller.register(app);

    app.use(express.static('public'));
    const server = app.listen(config.port);
    const end = () => {
        if(controller.Service.IsRunning)
        {
            logger.warn("Server is terminated while the logging service is still running.");
            controller.Service.stop();
        }
        server.close();
        setTimeout(() => process.exit(), 3000);
        logger.info("Server is stoppedd");
    };

    process.on('SIGTERM', end);
    process.on('SIGINT', end);

    logger.info("Server is started at port " + config.port);
}

(async function main() {
    await run();
})();

