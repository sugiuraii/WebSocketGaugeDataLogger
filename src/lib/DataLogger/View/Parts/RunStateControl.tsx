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
import React from "react";
import { FunctionComponent } from "react";
import { Button, Card, Form, ListGroup } from "react-bootstrap";

type RunStateControlProps = {
    RunningState : RunCommandModel,
    onStop : () => void
}

export const RunStateControl : FunctionComponent<RunStateControlProps> = (p) =>
{
    const enabledCodeListItems = p.RunningState.ParameterCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);

    return(
        <Card>
            <Form>
                <Form.Group controlId="runSettinng">
                    <Form.Label>DataStoreSize</Form.Label>
                    <Form.Control readOnly type="number" value={p.RunningState.DataStoreSize} />
                    <Form.Label>DataStoreInterval(ms)</Form.Label>
                    <Form.Control readOnly type="number" value={p.RunningState.DataStoreInterval} />
                    <Form.Label>WebSocketMessageInterval</Form.Label>
                    <Form.Control readOnly type="number" value={p.RunningState.WebsocketMessageInterval} />
                    <Form.Label>Enabled parameter code list</Form.Label>
                    <ListGroup>
                        {enabledCodeListItems}
                    </ListGroup>
                </Form.Group>
            </Form>
            <Button variant="primary" onClick={p.onStop}>Stop</Button>
        </Card>
    );
}
