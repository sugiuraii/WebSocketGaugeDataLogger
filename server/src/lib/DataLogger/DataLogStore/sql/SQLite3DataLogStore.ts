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
import { Database, Statement } from 'sqlite3';

export class SQLite3DataLogStore implements DataLogStore {
    private readonly database: Database;
    private activeTableName: string|undefined = undefined;
    private readonly keylist: string[];
    // Value buffer to store previous value
    private readonly valuebuffer: { [key: string]: number };
    constructor(database: Database, tablename: string, keylist: string[]) {
        this.database = database;
        this.activeTableName = tablename;
        this.keylist = keylist;
        this.valuebuffer = {};
        // Reset value buffer
        for(let key of keylist)
            this.valuebuffer[key] = 0;
    }
    public async getTableList(): Promise<string[]> {
        const tables = await this.allsqlAsync(this.database, "SHOW TABLES;");
        return tables;
    }
    
    public async createTable(tableName: string, keyNameList: string[]): Promise<void> {
        const sql = "CREATE TABLE " + this.activeTableName + " (time REAL, " + keyNameList.map(kn => kn + " REAL").join(', ') + ");";
        await this.runsqlAsync(this.database, sql);

    }
    
    public setActiveTable(tableName: string): void {
        this.activeTableName = tableName;
    }
    
    public async flushBuffer(): Promise<void> {
    }
    
    public async dropTable(tableName: string): Promise<void> {
        await this.runsqlAsync(this.database, "DROP TABLE "+tableName+";");
    }

    public async getSamples(tableName: string) : Promise<{time: number[], value : {[key : string] : number[]}}> {
        const query = "SELECT time, " + this.keylist.join(', ') + " FROM " + tableName + ";";
        const rows = await this.allsqlAsync(this.database, query);
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
        const column_str = "(time," + this.keylist.join(",") + ")";
        const value_str = "(?," + new Array<string>(this.keylist.length).fill('?').join(",") + ")";
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
        const sql = "INSERT INTO " + this.activeTableName + " " + column_str + " VALUES " + value_str + ";";
        await this.runsqlAsync(this.database, sql, ...valuelist);
    }

    public async close() {
    }

    // Wrapper of sqlite3 api to Promise
    private async runsqlAsync(db: Database, sql: string, ...params: any): Promise<Database> {
        return new Promise((resolve, reject) => {
            db.run(sql, params, (err) => {
                if (err) reject(err);
                resolve(db);
            })
        });
    }

    private async allsqlAsync(db: Database, sql: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            })
        });
    }
}
