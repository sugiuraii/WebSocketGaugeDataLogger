import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import express from "express";
import { DataLoggerController } from "lib/DataLogger/Controller/DataLoggerController";
import * as jsonc from "jsonc-parser";
import * as fs from "fs";

const parameterCodeList : WebsocketParameterCode[] = [WebsocketParameterCode.Engine_Speed, WebsocketParameterCode.Manifold_Absolute_Pressure];
require('./server.appconfig.jsonc');

type AppConfig = 
{
    port: number
};

const readAppConfig = () : AppConfig => jsonc.parse(fs.readFileSync("./config/server.appconfig.jsonc","utf8"));


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
    const end = () => 
    {
        controller.Service.stop();
        server.close();
        setTimeout( ()=>process.exit() , 3000);
    };
    
    process.on('SIGTERM', end);
    process.on('SIGINT', end);
}


(async function main() {
    await run();
    console.log(`Started`);
})();

