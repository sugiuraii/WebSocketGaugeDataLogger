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
import { Pool } from 'mariadb';
import { DataLogStoreWriteCache} from "../writecache/DataLogStoreWriteCahce";

export class MariaDBDataLogStore implements DataLogStore {
    private readonly connectionPool: Pool;
    private activeTableName: string|undefined = undefined;
    private batchBuffer: DataLogStoreWriteCache | undefined = undefined;
    private readonly batchBufferSize: number;
    constructor(connectionPool: Pool, batchBufferSize: number) {
        this.connectionPool = connectionPool;
        this.batchBufferSize = batchBufferSize;
    }

    public async getTableList(): Promise<string[]> {
        const tables = await this.connectionPool.query("SHOW TABLES;");
        return tables;
    }

    public async createTable(tableName: string, keyNameList: string[]): Promise<void> {
        const sql = "CREATE TABLE " + tableName + " (time REAL, " + keyNameList.map(kn => kn + " REAL").join(', ') + ");";
        await this.connectionPool.query(sql);
        const newActiveTableName = tableName;
        this.setActiveTable(newActiveTableName);
        this.batchBuffer = new DataLogStoreWriteCache(async vals => {
            const column_str = "(time," + keyNameList.join(",") + ")";
            const value_str = "(?," + new Array<string>(keyNameList.length).fill('?').join(",") + ")";
            const sql = "INSERT INTO " + newActiveTableName + " " + column_str + " VALUES " + value_str + ";";
            this.connectionPool.batch(sql, vals);
        }, this.batchBufferSize);
    }

    private setActiveTable(tableName: string): void {
        if(this.batchBuffer !== undefined)
            this.flushBuffer();
        this.activeTableName = tableName;
    }

    public async flushBuffer(): Promise<void> {
        if(this.batchBuffer === undefined)
            throw Error("Batch buffer is undefined. Cannot flush.");
        await this.batchBuffer.flush();
    }

    public async dropTable(tableName: string): Promise<void> {
        await this.connectionPool.query("DROP TABLE " + tableName + ";");
    }

    public async getSamples(): Promise<{ time: number[], value: { [key: string]: number[] } }> {
        const query = "SELECT * FROM " + this.activeTableName + ";";
        const rows = await this.connectionPool.query(query);
        const time: number[] = [];
        const value: { [key: string]: number[] } = {};

        for (let row of rows) {
            Object.keys(row).forEach(key => {
                if(key === "time")
                    time.push(row[key]);
                else {
                    if(!(key in value))
                        value[key] = [];
                    value[key].push(row[key]);
                }
            });
        }
        return {time : time, value : value};
    }

    public async pushSample(time: number, value: { [key: string]: number }): Promise<void> {
        const key_list = Object.keys(value);
        const column_str = "(time," + key_list.join(",") + ")";
        const value_str = "(?," + new Array<string>(key_list.length).fill('?').join(",") + ")";
        const valuelist: number[] = [];
        valuelist.push(time);
        for (let key of key_list) {
            valuelist.push(value[key])
        }
        const sql = "INSERT INTO " + this.activeTableName + " " + column_str + " VALUES " + value_str + ";";
        if(this.batchBuffer === undefined)
            throw Error("Batch buffer is undefined. Cannot push values.");
        await this.batchBuffer.write(valuelist);
    }

}
