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
import { Database } from 'sqlite3';

export class SQLite3DataLogStore implements DataLogStore {
    private readonly database: Database;
    private activeTableName: string|undefined = undefined;
    constructor(database: Database) {
        this.database = database;
    }
    public async getTableList(): Promise<string[]> {
        const tables = await this.allsqlAsync(this.database, "SHOW TABLES;");
        return tables;
    }
    
    public async createTable(tableName: string, keyNameList: string[]): Promise<void> {
        const sql = "CREATE TABLE " + tableName + " (time REAL, " + keyNameList.map(kn => kn + " REAL").join(', ') + ");";
        await this.runsqlAsync(this.database, sql);
    }
    
    public setActiveTable(tableName: string): void {
        this.activeTableName = tableName;
    }
    
    public async flushBuffer(): Promise<void> {
    }
    
    public async dropTable(tableName: string): Promise<void> {
        await this.runsqlAsync(this.database, "DROP TABLE " + tableName + ";");
    }

    public async getSamples(tableName: string) : Promise<{time: number[], value : {[key : string] : number[]}}> {
        const query = "SELECT * FROM " + tableName + ";";
        const rows = await this.allsqlAsync(this.database, query);
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
