/* 
 * The MIT License
 *
 * Copyright 2021 sz2.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import express from "express";
import { DataLoggerController } from "lib/DataLogger/Controller/DataLoggerController";
import * as jsonc from "jsonc-parser";
import * as fs from "fs";
import log4js from "log4js";
import { DefaultErrorHandler } from "lib/DataLogger/ErrorHandler/DefaultErrorHandler";
import { DataLogStoreFactory } from "lib/DataLogger/DataLogStore/DataLogStoreFactory";
import * as sqlite3 from "sqlite3"
import * as mariadb from "mariadb"

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
        port: number,
        store: "memory" | "sqlite3" | "mariadb",
        memorystore: {
            maxStoreSize: number
        },
        sqlite3store: {
            dbname: string
        },
        mariadbstore: {
            host: string,
            user: string,
            password: string,
            database: string
        }
    };

const readAppConfig = (): AppConfig => jsonc.parse(fs.readFileSync("./config/server.appconfig.jsonc", "utf8"));

const createStore = (config :AppConfig) => {
    const mariadb_batch_buffer_size = 50;
    if(config.store.toLowerCase() === "memory")
        return DataLogStoreFactory.getMemoryDataLogStore(config.memorystore.maxStoreSize);
    if(config.store.toLowerCase() === "sqlite3")
        return DataLogStoreFactory.getSQLite3DataLogStore(new sqlite3.Database(config.sqlite3store.dbname));
    if(config.store.toLocaleLowerCase() === "mariadb")
        return DataLogStoreFactory.getMariaDBDataLogStore(mariadb.createPool({host: config.mariadbstore.host, user: config.mariadbstore.user, password: config.mariadbstore.password, database: config.mariadbstore.database}), mariadb_batch_buffer_size);

    throw Error("Invalid store type in configuration.");
}

const run = async () => {
    const config = readAppConfig();

    const app = express();
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(express.json());

    const controller = new DataLoggerController();
    const store = createStore(config);
    controller.register(app, store);

    app.use(express.static('public'));

    // Register error handler
    app.use(DefaultErrorHandler);

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

