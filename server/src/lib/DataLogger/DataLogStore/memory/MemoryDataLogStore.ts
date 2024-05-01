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

import { DataLogStore } from "../DataLogStore";

type DataTable = {time : number[], value : {[key : string] : number[]}}

export class MemoryDataLogStore implements DataLogStore
{
    private readonly dataTables = new Map<string, DataTable>();
    private activeTableName: string | undefined = undefined;
    private readonly maxStoreSize: number;
    constructor(maxStoreSize: number){
        this.maxStoreSize = maxStoreSize;
    }
    public async getTableList(): Promise<string[]> {
        return [...this.dataTables.keys()];
    }
    public async createTable(tableName: string, keyNameList: string[]): Promise<void> {
        const value : {[key : string] : number[]} = {};
        keyNameList.forEach(key => value[key] = []);
        this.dataTables.set(tableName, {time:[], value:value});
        this.setActiveTable(tableName);
    }
    private setActiveTable(tableName: string): void {
        this.activeTableName = tableName;
    }
    public async flushBuffer(): Promise<void> {
    }
    public async dropTable(tableName: string): Promise<void> {
        this.dataTables.delete(tableName);
    }
    
    public async getSamples(tableName: string) : Promise<{time: number[], value : {[key : string] : number[]}}> { 
        const samples = this.dataTables.get(tableName);
        if(samples === undefined)
            throw Error("Table name of " + tableName + " does not exist.");
        return samples;
    }
    
    public async pushSample(time : number, value : {[key : string] : number}): Promise<void>
    {
        if(this.activeTableName === undefined) {
            throw Error("Active table name of data store is undefined.");
        }
        const target = this.dataTables.get(this.activeTableName);
        if(target === undefined)
            throw Error("The table of active table name (" + this.activeTableName + ") dose not exist.");

        if(target.time.length >= this.maxStoreSize)
        {
            target.time.shift();
            Object.keys(target.value).forEach(key => target.value[key].shift());   
        }

        target.time.push(time);
        for(let key of Object.keys(value))
        {
            if(target.value[key])
                target.value[key].push(value[key])
            else
                throw new Error("Key of " + key + " is not exist in datastore.");
        }
    }
}
