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
    private readonly tablename: string;
    private readonly keylist: string[];
    private readonly batchBuffer: DataLogStoreWriteCache;
    private dirty = false;
    // Value buffer to store previous value
    private readonly valuebuffer: { [key: string]: number };
    constructor(connectionPool: Pool, tablename: string, keylist: string[], batchBufferSize: number) {
        this.connectionPool = connectionPool;
        this.tablename = tablename;
        this.keylist = keylist;
        this.batchBuffer = new DataLogStoreWriteCache(async vals => {
            const column_str = "(time," + this.keylist.join(",") + ")";
            const value_str = "(?," + new Array<string>(this.keylist.length).fill('?').join(",") + ")";
            const sql = "INSERT INTO " + this.tablename + " " + column_str + " VALUES " + value_str + ";";
            this.connectionPool.batch(sql, vals);
        }, batchBufferSize)
        this.valuebuffer = {};
        // Reset value buffer
        for(let key of keylist)
            this.valuebuffer[key] = 0;
    }

    public async getSamples(): Promise<{ time: number[], value: { [key: string]: number[] } }> {
        const query = "SELECT time, " + this.keylist.join(', ') + " FROM " + this.tablename + ";";
        const rows = await this.connectionPool.query(query);
        const time: number[] = [];
        const value: { [key: string]: number[] } = {};
        for(let key of this.keylist)
            value[key] = [];

        for (let row of rows) {
            time.push(row["time"]);
            this.keylist.forEach(key => value[key].push(row[key]));
        }
        return {time : time, value : value};
    }

    public async pushSample(time: number, value: { [key: string]: number }): Promise<void> {
        // Create table
        if (!this.dirty) {
            const sql = "CREATE TABLE " + this.tablename + " (time REAL, " + this.keylist.map(kn => kn + " REAL").join(', ') + ");";
            await this.connectionPool.query(sql);
            this.dirty = true;
        }

        const valuelist: number[] = [];
        valuelist.push(time);
        for (let key of this.keylist) {
            if (value[key] !== undefined) {
                valuelist.push(value[key])
                this.valuebuffer[key] = value[key];
            }
            else
                // Retreve previous value from valuebuffer
                valuelist.push(this.valuebuffer[key]);
        }
        await this.batchBuffer.write(valuelist);
    }

    public async close() {
        await this.batchBuffer.flush();
    }
}
