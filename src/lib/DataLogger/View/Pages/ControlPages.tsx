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

import { StateModel } from "lib/DataLogger/Model/StateModel";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import React from "react";
import { useEffect, useState, VoidFunctionComponent } from "react";
import { RunCommandControl } from "../Parts/RunCommandControl";
import { RunStateControl } from "../Parts/RunStateControl";

export const ControlPage : VoidFunctionComponent = () => {
    const [appState, setAppState] = useState<StateModel>({IsRunning : false, RunningCommand : {DataStoreInterval : 0, DataStoreSize : 0, ParameterCodeList :[], WebsocketMessageInterval : 0}});
    
    useEffect( () => {
        fetch("/api/state").then(res => res.json().then(obj => setAppState(obj)));
    });

    const pageElem = appState.IsRunning?
                <RunStateControl RunningState={appState.RunningCommand} onStop={ async () => await fetch('/api/stop', {method: 'post', headers: { 'Content-Type': 'application/json' },  body: "" })}/>
                :
                <RunCommandControl
                    parameterCodeToSelect={[WebsocketParameterCode.Engine_Load, WebsocketParameterCode.Engine_Speed, WebsocketParameterCode.Manifold_Absolute_Pressure]}
                    onSet={ async (p) => 
                    {
                        console.log(p);
                        const res = await (await fetch('/api/run', {method: 'post', headers: { 'Content-Type': 'application/json' },  body: JSON.stringify(p) })).json();
                        console.log(res);
                    }}
                />;
    return(
        <>
            {pageElem}
        </>
    );
};