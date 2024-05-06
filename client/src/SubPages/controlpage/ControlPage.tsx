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

import { RunResultModel } from "lib/DataLogger/Model/RunResultModel";
import { StateModel } from "lib/DataLogger/Model/StateModel";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import React from "react";
import { useEffect, useState, FunctionComponent } from "react";
import { RunCommandControl } from "./components/RunCommandControl";
import { RunStateControl } from "./components/RunStateControl";
import axios from 'axios';
import { axiosWrapper } from "lib/axios-utils/AxiosErrorHandlerWrapper"

export type ControlPageProps = 
{
    initialState : StateModel,
    parameterCodeListToSelect : WebsocketParameterCode[]
};

export const ControlPage : FunctionComponent<ControlPageProps> = (p) => {
    const [appState, setAppState] = useState<StateModel>(p.initialState);
    
    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await axios.get("/api/state");
            setAppState(res.data);
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const pageElem = appState.IsRunning?
                <RunStateControl RunningState={appState.RunningCommand} onStop={ async () => await axiosWrapper.post('/api/stop')}/>
                :
                <RunCommandControl
                    defaultSetting={appState.RunningCommand}
                    parameterCodeToSelect={p.parameterCodeListToSelect}
                    onSet={ async (p) => 
                    {
                        console.log(p);
                        const res :  RunResultModel = (await axiosWrapper.post('/api/run', JSON.stringify(p), {headers: { 'Content-Type': 'application/json'}})).data;
                        console.log(res);
                        if(!res.IsSucceed)
                            window.alert("Error : " + res.Error);
                    }}
                />;
    return(
        <>
            {pageElem}
        </>
    );
};