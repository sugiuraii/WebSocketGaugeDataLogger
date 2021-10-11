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

import { useEffect, useState, VoidFunctionComponent, FunctionComponent } from "react";
import * as Echarts from 'echarts'
import ReactEcharts from 'echarts-for-react'
import React from "react";
import { Button, Card, Form, ListGroup } from "react-bootstrap";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import { ChartPanel } from "../Parts/ChartPanel";

type CodeSelectorProps =
    {
        availableCodeList: WebsocketParameterCode[],
        onSet: (leftAxisCodeList: WebsocketParameterCode[], rightAxisCodeList: WebsocketParameterCode[]) => void
    }

const CodeSelector: FunctionComponent<CodeSelectorProps> = (p) => {
    const [selectedCode, setSelectedCode] = useState(p.availableCodeList[0]);

    const [leftAxisCodeList, setLeftAxisCodeList] = useState<WebsocketParameterCode[]>([]);
    const [rightAxisCodeList, setRightAxisCodeList] = useState<WebsocketParameterCode[]>([]);

    const codeListItems = p.availableCodeList.map(c => <option key={c}>{c}</option>);
    const leftAxisCodeListItems = leftAxisCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);
    const rightAxisCodeListItems = rightAxisCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);
    
    const handleAddLeft = () => {
        const newEnabledCode = [...leftAxisCodeList];  // Need to re-create array to update DOM.
        if(!newEnabledCode.includes(selectedCode))
            newEnabledCode.push(selectedCode);
        setLeftAxisCodeList(newEnabledCode);
    };

    const handleAddRight = () => {
        const newEnabledCode = [...rightAxisCodeList];  // Need to re-create array to update DOM.
        if(!newEnabledCode.includes(selectedCode))
            newEnabledCode.push(selectedCode);
        setRightAxisCodeList(newEnabledCode);
    };

    const handleRemoveLeft = () =>{
        const newEnabledCode = [...leftAxisCodeList].filter(c => c !== selectedCode);
        setLeftAxisCodeList(newEnabledCode);
    };

    const handleRemoveRight = () =>{
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
                        <Form.Control as="select" value={selectedCode} onChange={e => setSelectedCode(e.target.value as WebsocketParameterCode)}>
                            {codeListItems}
                        </Form.Control>
                        <Button variant="primary" onClick={handleAddLeft}>Add to left axis</Button>
                        <Button variant="secondary" onClick={handleRemoveLeft}>Remove from left axis</Button>
                        <Button variant="primary" onClick={handleAddRight}>Add to right axis</Button>
                        <Button variant="secondary" onClick={handleRemoveRight}>Remove from left axis</Button>
                        <Button variant="danger" onClick={handleReset}>Reset</Button>
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

export const ChartPage: VoidFunctionComponent = () => {
    const [chartOptions, setChartOptions] = useState<Echarts.EChartOption[]>([]);
    const [availableCodeList, setAvailableCodeList] = useState<WebsocketParameterCode[]>([]);

    // Query code list of store when the element is mounted
    useEffect(() => {
        let cleanedUp = false;
        fetch("/api/store/codelist").then(res => res.json().then((obj: WebsocketParameterCode[]) => {
            if (obj.length !== 0) // No code list => No data.
            {
                if (!cleanedUp)
                    setAvailableCodeList([...obj]);
            }
        }));
        const cleanUp = () => { cleanedUp = true };
        return cleanUp;
    }, []);

    const codeListItems = availableCodeList.map(c => <option key={c}>{c}</option>);

    const handleAddChart = async (leftAxisCodeList: WebsocketParameterCode[], rightAxisCodeList: WebsocketParameterCode[]) => {
        const res = await fetch("/api/store");
        const dataStore: { time: number[], value: { [key: string]: number[] } } = await res.json();

        const yAxisOption: Echarts.EChartOption.YAxis[] = [];
        const seriesOption: Echarts.EChartOption.Series[] = [];

        let axisIndex = 0;
        for (let code in leftAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, position:'left' });
            seriesOption.push({ data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
        }
        for (let code in rightAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, position:'right' });
            seriesOption.push({ data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
        }

        const option: Echarts.EChartOption = {
            tooltip: {
                show: true,
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: dataStore.time
            },
            yAxis: yAxisOption,
            series: seriesOption
        };

        const newChartOptions = [...chartOptions];
        newChartOptions.push(option);
        setChartOptions(newChartOptions);
    }

    const handleRemoveChart = (index : number) => 
    {
        const newChartOptions = [...chartOptions];
        newChartOptions.splice(index, 1);
        setChartOptions(newChartOptions);        
    }

    const chartElem = () => 
    {
        if (chartOptions.length === 0)
            return (<div>Data is not available.</div>);
        else
        {
            const charts : JSX.Element[] = [];
            for(let i = 0; i < chartOptions.length; i++)
                charts.push(<ChartPanel  option={chartOptions[i]} onClose={()=>handleRemoveChart(i)} />)
        }
    }
    
    return (
        <>
            <CodeSelector availableCodeList={availableCodeList} onSet={(leftAxisCodeList, rightAxisCodeList)=>handleAddChart(leftAxisCodeList, rightAxisCodeList) } />
            {chartElem()}
        </>
    )
}