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
import * as mariadb from "mariadb";
import {asyncWrap} from "./util/AsyncFunctionWrapper"

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
        
        //const store = DataLogStoreFactory.getMemoryDataLogStore(command.ParameterCodeList, command.DataStoreSize);
        //const store = DataLogStoreFactory.getSQLite3DataLogStore(new Database(":memory:"));
        const store = DataLogStoreFactory.getMariaDBDataLogStore(mariadb.createPool({host: '0.0.0.0', user: 'test', password: 'test', database: 'test1', connectionLimit: 5}), 20);
        let runningCommand : RunCommandModel = {DataStoreInterval : 100, DataStoreSize : 10000, TableName: "", ParameterCodeList : [], WebsocketMessageInterval : 0}
        
        app.get('/api/store/tablelist', asyncWrap(async (_, res) => res.send(JSON.stringify(await store.getTableList()))));
        app.get('/api/store/get', asyncWrap(async (req, res) => {            
            const tablename = req.query.tablename as string | undefined;
            if(tablename === undefined) throw Error("Query of table name is not defined.");
            const samples = await store.getSamples(tablename);
            res.send(JSON.stringify(samples));
            this.logger.info("Data store is requested from " + req.headers.host);
        }));
        app.get('/api/store/getAsCSV', asyncWrap(async (req, res) => {
            const tablename = req.query.tablename as string | undefined;
            if(tablename === undefined) throw Error("Query of table name is not defined.");
            await res.send(convertDataLogStoreToCsv(store, tablename));
            this.logger.info("Data store is requested by csv format, from " + req.headers.host);
        }));
        app.get('/api/store/drop', asyncWrap(async (req, res) => {
            const tablename = req.query.tablename as string | undefined;
            if (tablename === undefined) throw Error("Query of table name is not defined.");
            try {
                await store.dropTable(tablename);
                const result: RunResultModel = { IsSucceed: true, Error: "" };
                await res.send(result);
                this.logger.info("Data table : " + tablename + " is dropped, by the request from " + req.headers.host);
            } catch (e) {
                if (e instanceof Error) {
                    this.logger.error(e);
                    const result: RunResultModel = { IsSucceed: false, Error: e.message };
                    res.send(result);
                }
                else
                    throw e;
            }
        }));
        app.get('/api/store/getcodelist', asyncWrap(async (req, res) => {
            const tablename = req.query.tablename as string | undefined;
            if(tablename === undefined) throw Error("Query of table name is not defined.");
            res.send(JSON.stringify(Object.keys((await store.getSamples(tablename)).value)))
        }));
        
        app.get('/api/setting/available_code_list', (_, res) => res.send(service.getAvailableParameterCodeList()));
        app.get('/api/state', (_, res) => {
            const runState : StateModel = {IsRunning : service.IsRunning, RunningCommand : runningCommand};
            res.send(JSON.stringify(runState));
        })

        app.post('/api/run', asyncWrap(async (req, res) => {
            const command : RunCommandModel = req.body;
            runningCommand = command;
            this.logger.info("Logger service is stated. Running command is ...");
            this.logger.info(JSON.stringify(command));
            await store.createTable(runningCommand.TableName, command.ParameterCodeList);
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
        }));

        app.post('/api/stop', asyncWrap(async(_, res) => 
        {
            service.stop();
            while(!service.IsRunning) {
                await new Promise(resolve => setTimeout(resolve, stopPollingInterval));
            }

            const runState : StateModel = {IsRunning : service.IsRunning, RunningCommand : runningCommand};
            res.send(JSON.stringify(runState));
            this.logger.info("Logger service is stopped.");
        }));
    }
}