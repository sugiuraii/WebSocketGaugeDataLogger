import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import express from "express";
import { DataLoggerController } from "lib/DataLogger/Controller/DataLoggerController";

const parameterCodeList : WebsocketParameterCode[] = [WebsocketParameterCode.Engine_Speed, WebsocketParameterCode.Manifold_Absolute_Pressure];

const run = async () => {
    //const dataloggerService = new DataLoggerService(100);
    //const store = getMemoryDataLogStore(1000);
    //const ct = getCancellationToken();

    const app = express();
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(express.json());

    const controller = new DataLoggerController();
    controller.register(app);

    /*
    app.get('/test', (req, res) =>
    {
        res.send(JSON.stringify(store.Store));
    });
    */
    app.use(express.static('public'));
    const server = app.listen(3000);
    //await dataloggerService.run(ct, store, parameterCodeList);
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

