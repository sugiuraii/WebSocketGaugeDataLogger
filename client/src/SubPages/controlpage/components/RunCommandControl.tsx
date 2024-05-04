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

import { RunCommandModel } from "lib/DataLogger/Model/RunCommandModel";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import React from "react";
import { FunctionComponent, useState } from "react";
import { Button, Card, Form, ListGroup } from "react-bootstrap";

type RunCommandControlProps = {
    defaultSetting : RunCommandModel,
    parameterCodeToSelect : WebsocketParameterCode[],
    onSet: (dat : RunCommandModel) => void
}

export const RunCommandControl : FunctionComponent<RunCommandControlProps> = (p) =>
{
    const selectOptions = p.parameterCodeToSelect.map(c => <option key={c}>{c}</option>);

    const [dataStoreSize, setDataStoreSize] = useState(p.defaultSetting.DataStoreSize);
    const [dataStoreInterval, setDataStoreInterval] = useState(p.defaultSetting.DataStoreInterval);
    const [websocketmessageInterval, setWebsocketmessageInterval] = useState(p.defaultSetting.WebsocketMessageInterval);
    const [selectedCode, setSelectedCode] = useState(p.parameterCodeToSelect[0]);
    const [enabledCode, setEnabledCode] = useState<WebsocketParameterCode[]>(p.defaultSetting.ParameterCodeList);

    const handleAdd = () =>{
        const newEnabledCode = [...enabledCode];  // Need to re-create array to update DOM.
        if(!newEnabledCode.includes(selectedCode))
            newEnabledCode.push(selectedCode);
        setEnabledCode(newEnabledCode);
    };

    const handleRemove = () =>{
        const newEnabledCode = [...enabledCode].filter(c => c !== selectedCode);
        setEnabledCode(newEnabledCode);
    };

    const handleReset = () => {
        setEnabledCode([]);
    }
    
    const handleSet = () => {
        const dat = {TableName: "test1", DataStoreInterval : dataStoreInterval, DataStoreSize : dataStoreSize, WebsocketMessageInterval : websocketmessageInterval, ParameterCodeList : enabledCode};
        p.onSet(dat);
    };

    const enabledCodeListItems = enabledCode.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);

    return(
        <Card>
            <Form>
                <Form.Group controlId="runSettinng">
                    <Form.Label>DataStoreSize</Form.Label>
                    <Form.Control type="number" min={0} value={dataStoreSize} onChange={(evt) => setDataStoreSize(Number(evt.target.value))} />
                    <Form.Label>DataStoreInterval(ms)</Form.Label>
                    <Form.Control type="number" min={10} value={dataStoreInterval} onChange={(evt) => setDataStoreInterval(Number(evt.target.value))} />
                    <Form.Label>WebSocketMessageInterval</Form.Label>
                    <Form.Control type="number" min={0} value={websocketmessageInterval} onChange={(evt) => setWebsocketmessageInterval(Number(evt.target.value))} />
                    <Form.Label>Parameter Code Select</Form.Label>
                    <Form.Control as="select" value={selectedCode} onChange={e => setSelectedCode(e.target.value as WebsocketParameterCode)}>
                        {selectOptions}
                    </Form.Control>
                    <Button variant="primary" onClick={handleAdd}>Add</Button>
                    <Button variant="secondary" onClick={handleRemove}>Remove</Button>
                    <Button variant="danger" onClick={handleReset}>Reset</Button>
                    <Form.Label>Enabled parameter code list</Form.Label>
                    <ListGroup>
                        {enabledCodeListItems}
                    </ListGroup>
                </Form.Group>
            </Form>
            <Button variant="primary" onClick={handleSet}>Run</Button>
        </Card>
    );
}
