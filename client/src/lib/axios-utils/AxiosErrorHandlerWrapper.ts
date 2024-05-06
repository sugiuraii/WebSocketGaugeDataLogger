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

import axios, { AxiosError } from 'axios'
import { AxiosRequestConfig, AxiosResponse } from 'axios';

export class AxiosErrorHandlerWrapper {
    private readonly errorHanlder: (reason: any) => void;
    constructor(errorHandler: (reason: any) => void) {
        this.errorHanlder = errorHandler;
    }

    public async get(url: string, config?: AxiosRequestConfig<any> | undefined):Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.get(url, config);
        } catch (e) {
            this.errorHanlder(e);
            return undefined;
        }
    }

    public async post(url: string, data?: any, config?: AxiosRequestConfig<any> | undefined): Promise<AxiosResponse<any, any> | undefined> {
        try{
            return await axios.post(url, data, config);
        } catch(e){
            this.errorHanlder(e);
            return undefined;
        }
    }
}

export const axiosWrapper = new AxiosErrorHandlerWrapper(reason => {
    if(reason instanceof AxiosError) {
        const message = reason.message + "\n" + reason.response?.data;
        window.alert(message);
    } else {
        throw reason;
    }
});