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
import { Express } from "express";
import { ConsoleLogger } from "lib/MeterAppBase/utils/ConsoleLogger";
import { ILogger } from "lib/MeterAppBase/utils/ILogger";
import { CancellationToken, CancellationTokenFactory } from "lib/utils/CancellationToken";
import { DataLogStoreFactory } from "../Model/DataLogStore";
import { RunCommandModel } from "../Model/RunCommandModel";
import { StateModel } from "../Model/StateModel";
import { DataLoggerService } from "../Service/DataLoggerService";

export class DataLoggerController
{
    private logger : ILogger;
    constructor(logger? : ILogger)
    {
        this.logger = (logger === undefined)?(new ConsoleLogger()):logger;
    }

    public register(app : Express) : void
    {
        const service = new DataLoggerService();
        const stopPollingInterval = 10;
        
        let store = DataLogStoreFactory.getMemoryDataLogStore(1);
        let runningCommand : RunCommandModel = {DataStoreInterval : 0, DataStoreSize : 0, ParameterCodeList : [], WebsocketMessageInterval : 0}

        app.get('/api/store', (req, res) => res.send(JSON.stringify(store.Store)));
        app.get('/api/setting/available_code_list', (req, res) => res.send(service.getAvailableParameterCodeList()));
        app.get('/api/state', (req, res) => 
        {
            const runState : StateModel = {IsRunning : service.IsRunning, RunningCommand : runningCommand};
            res.send(JSON.stringify(runState));
        })

        app.post('/api/run', async (req, res) => 
        {
            const command : RunCommandModel = req.body;
            runningCommand = command;
            this.logger.appendLog(JSON.stringify(command));
            store = DataLogStoreFactory.getMemoryDataLogStore(command.DataStoreSize);
            await service.run(store, command.ParameterCodeList, command.DataStoreInterval, command.WebsocketMessageInterval);
        });

        app.post('/api/stop', async(req, res) => 
        {
            service.stop();
            while(!service.IsRunning) {
                await new Promise(resolve => setTimeout(resolve, stopPollingInterval));
            }

            const runState : StateModel = {IsRunning : service.IsRunning, RunningCommand : runningCommand};
            res.send(JSON.stringify(runState));
        });
    }
}