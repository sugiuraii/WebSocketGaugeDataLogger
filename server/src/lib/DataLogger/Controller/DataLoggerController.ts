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
import { RunCommandModel } from "../Model/RunCommandModel";
import { RunResultModel } from "../Model/RunResultModel";
import { StateModel } from "../Model/StateModel";
import { DataLoggerService } from "../Service/DataLoggerService";
import log4js from "log4js";
import { DataLogStoreFactory } from "../DataLogStore/DataLogStoreFactory";
import { convertDataLogStoreToCsv } from "../DataLogStore/DataLogStoreUtils";
import { Database } from "sqlite3";
import * as mariadb from "mariadb";

export class DataLoggerController
{
    private logger = log4js.getLogger();
    private service : DataLoggerService;
    constructor()
    {
        this.service = new DataLoggerService();
    }

    public get Service() : DataLoggerService { return this.service }

    public register(app : Express) : void
    {
        const service = this.service;
        const stopPollingInterval = 10;
        
        let store = DataLogStoreFactory.getMemoryDataLogStore(["null"], 1);
        let runningCommand : RunCommandModel = {DataStoreInterval : 100, DataStoreSize : 10000, ParameterCodeList : [], WebsocketMessageInterval : 0}

        app.get('/api/store', async (req, res) => 
        {
            const samples = await store.getSamples();
            res.send(JSON.stringify(samples));
            this.logger.info("Data store is requested from " + req.headers.host);
        });

        app.get('/api/store/getAsCSV', async (req, res) => 
        {
            await res.send(convertDataLogStoreToCsv(store))
            this.logger.info("Data store is requested by csv format, from " + req.headers.host);
        });
        app.get('/api/store/codelist', async (_, res) => res.send(JSON.stringify(Object.keys((await store.getSamples()).value))));
        app.get('/api/setting/available_code_list', (_, res) => res.send(service.getAvailableParameterCodeList()));
        app.get('/api/state', (_, res) => 
        {
            const runState : StateModel = {IsRunning : service.IsRunning, RunningCommand : runningCommand};
            res.send(JSON.stringify(runState));
        })

        app.post('/api/run', async (req, res) => 
        {
            const command : RunCommandModel = req.body;
            runningCommand = command;
            this.logger.info("Logger service is stated. Running command is ...");
            this.logger.info(JSON.stringify(command));
            store = DataLogStoreFactory.getMemoryDataLogStore(command.ParameterCodeList, command.DataStoreSize);
            //store = DataLogStoreFactory.getSQLite3DataLogStore(new Database(":memory:"), "test1", command.ParameterCodeList);
            //store = DataLogStoreFactory.getMariaDBDataLogStore(mariadb.createPool({host: '0.0.0.0', user: 'test', password: 'test', database: 'test1', connectionLimit: 5}), "testtable1", command.ParameterCodeList, 20);
            try
            {
                await service.run(store, command.ParameterCodeList, command.DataStoreInterval, command.WebsocketMessageInterval);
                const result : RunResultModel = {IsSucceed : true, Error : ""}; 
                res.send(result);
            }
            catch(e)
            {
                if(e instanceof Error)
                {
                    this.logger.error(e);
                    const result : RunResultModel = {IsSucceed : false, Error : e.message}; 
                    res.send(result);
                }
                else
                    throw e;
            }
        });

        app.post('/api/stop', async(_, res) => 
        {
            service.stop();
            while(!service.IsRunning) {
                await new Promise(resolve => setTimeout(resolve, stopPollingInterval));
            }

            const runState : StateModel = {IsRunning : service.IsRunning, RunningCommand : runningCommand};
            res.send(JSON.stringify(runState));
            this.logger.info("Logger service is stopped.");
        });
    }
}