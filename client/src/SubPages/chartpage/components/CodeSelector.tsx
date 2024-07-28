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

import { useState, FunctionComponent } from "react";
import React from "react";
import { Button, Card, Form, ListGroup } from "react-bootstrap";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";

type CodeSelectorProps =
    {
        codeToSelect: WebsocketParameterCode[],
        onSet: (leftAxisCodeList: WebsocketParameterCode[], rightAxisCodeList: WebsocketParameterCode[]) => void
    }

export const CodeSelector: FunctionComponent<CodeSelectorProps> = (p) => {
    const [selectedCode, setSelectedCode] = useState<WebsocketParameterCode>();
    const [leftAxisCodeList, setLeftAxisCodeList] = useState<WebsocketParameterCode[]>([]);
    const [rightAxisCodeList, setRightAxisCodeList] = useState<WebsocketParameterCode[]>([]);

    const codeListItems = p.codeToSelect.map(c => <option key={c}>{c}</option>);
    codeListItems.unshift(<option key={"---"}>---</option>);
    const leftAxisCodeListItems = leftAxisCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);
    const rightAxisCodeListItems = rightAxisCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);

    const handleAddLeft = () => {
        if (selectedCode === undefined)
            return;
        const newEnabledCode = [...leftAxisCodeList];  // Need to re-create array to update DOM.
        if (!newEnabledCode.includes(selectedCode))
            newEnabledCode.push(selectedCode);
        setLeftAxisCodeList(newEnabledCode);
    };

    const handleAddRight = () => {
        if (selectedCode === undefined)
            return;
        const newEnabledCode = [...rightAxisCodeList];  // Need to re-create array to update DOM.
        if (!newEnabledCode.includes(selectedCode))
            newEnabledCode.push(selectedCode);
        setRightAxisCodeList(newEnabledCode);
    };

    const handleRemoveLeft = () => {
        const newEnabledCode = [...leftAxisCodeList].filter(c => c !== selectedCode);
        setLeftAxisCodeList(newEnabledCode);
    };

    const handleRemoveRight = () => {
        const newEnabledCode = [...rightAxisCodeList].filter(c => c !== selectedCode);
        setRightAxisCodeList(newEnabledCode);
    };

    const handleReset = () => {
        setLeftAxisCodeList([]);
        setRightAxisCodeList([]);
    }

    return (
        <>
            <Card>
                <Card.Header>Plot data select</Card.Header>
                <Card>
                    <Card.Header>Code select</Card.Header>
                    <Card.Body>
                        <Form.Control as="select" value={selectedCode} onChange={e => {
                            if (e.target.value !== "---")
                                setSelectedCode(e.target.value as WebsocketParameterCode);
                        }}>
                            {codeListItems}
                        </Form.Control>
                        <div>
                            <Button variant="primary" onClick={handleAddLeft}>Add to left axis</Button>
                            <Button variant="secondary" onClick={handleRemoveLeft}>Remove from left axis</Button>
                        </div>
                        <div>
                            <Button variant="primary" onClick={handleAddRight}>Add to right axis</Button>
                            <Button variant="secondary" onClick={handleRemoveRight}>Remove from left axis</Button>
                        </div>
                        <div>
                            <Button variant="danger" onClick={handleReset}>Reset</Button>
                        </div>
                    </Card.Body>
                </Card>
                <Card>
                    <Card>
                        <Card.Header>Left axis</Card.Header>
                        <Card.Body><ListGroup>{leftAxisCodeListItems}</ListGroup></Card.Body>
                    </Card>
                    <Card>
                        <Card.Header>Right axis</Card.Header>
                        <Card.Body><ListGroup>{rightAxisCodeListItems}</ListGroup></Card.Body>
                    </Card>
                </Card>
                <Button variant="primary" onClick={() => p.onSet(leftAxisCodeList, rightAxisCodeList)}>Add chart</Button>
            </Card>
        </>
    )
}
