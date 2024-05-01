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

import { WebsocketObjectCollection, WebsocketObjectCollectionOption } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketObjectCollection";
import * as DefaultAppSettings from "lib/MeterAppBase/DefaultAppSettings"
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import { ReadModeCode } from "lib/WebSocket/WebSocketCommunication";
import { performance } from 'perf_hooks';
import { ILogger } from "lib/MeterAppBase/utils/ILogger";
import { CancellationToken, CancellationTokenFactory } from "lib/utils/CancellationToken";
import { Log4jsLogger } from "lib/MeterAppBase/utils/Log4jsLogger";
import { DataLogStore } from "../DataLogStore/DataLogStore";

export class DataLoggerService
{
    private readonly Logger : ILogger;
    private readonly WSOption : WebsocketObjectCollectionOption;
    private cancellationToken : CancellationToken | undefined = undefined;
    
    public get IsRunning() : boolean {return this.cancellationToken !== undefined }

    constructor(logger? : ILogger)
    {
        this.Logger = (logger === undefined)?(new Log4jsLogger()): logger;
        this.WSOption = DefaultAppSettings.getWebsocketCollectionOption();
    }

    public getAvailableParameterCodeList() : WebsocketParameterCode[]
    {
        return Array.from(this.WSOption.WSMap.keys());
    }

    public async run(store : DataLogStore, parameterCodeList : WebsocketParameterCode[], dataStoreInterval : number, websocketMessageInterval : number)
    {
        if(this.cancellationToken !== undefined)
            throw new Error("DataLoggerService.run() is called. However DataLoggerSerice is already running.");
        if(parameterCodeList.length === 0)
            throw new Error("Parameter code list is empty.");

        const wsOption = this.WSOption;
        const wsc = new WebsocketObjectCollection(this.Logger, wsOption, websocketMessageInterval);
        parameterCodeList.forEach(code => wsc.WSMapper.registerParameterCode(code as WebsocketParameterCode, ReadModeCode.SLOWandFAST));
        this.cancellationToken = CancellationTokenFactory.get();
        wsc.Run();
        while(!this.cancellationToken.IsCancellationRequested)
        {
            const time = performance.now() + performance.timeOrigin;
            const value : {[key : string] : number}  =  {};
            parameterCodeList.forEach(code => value[code] = wsc.WSMapper.getValue(code as WebsocketParameterCode));
            await store.pushSample(time, value);
            await new Promise(resolve => setTimeout(resolve, dataStoreInterval));
        }
        store.flushBuffer();
        wsc.Stop();
        this.cancellationToken = undefined;
    }   

    public stop()
    {
        if(this.cancellationToken === undefined)
            throw new Error("DataLoggerService.stop() is called. However DataLoggerSerice is not running.");
        else
            this.cancellationToken.cancel();
    }
}