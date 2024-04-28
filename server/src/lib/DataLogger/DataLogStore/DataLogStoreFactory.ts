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

import { DataLogStore } from "./DataLogStore";
import { MemoryDataLogStore } from "./memory/MemoryDataLogStore";
import { Database } from 'sqlite3';
import { Pool } from 'mariadb';
import { SQLite3DataLogStore } from "./sql/SQLite3DataLogStore";
import { MariaDBDataLogStore } from "./sql/MariaDBDataLogStore";

export class DataLogStoreFactory
{
    public static getMemoryDataLogStore(keylist: string[], maxStoreSize : number) : DataLogStore {
        return new MemoryDataLogStore(keylist, maxStoreSize)
    };
    public static getSQLite3DataLogStore(database: Database, tablename: string, keylist: string[]) {
        return new SQLite3DataLogStore(database, tablename, keylist);
    }
    public static getMariaDBDataLogStore(connectionPool: Pool, tablename: string, keylist: string[], batchBufferSize: number) {
        return new MariaDBDataLogStore(connectionPool, tablename, keylist, batchBufferSize);
    }
}