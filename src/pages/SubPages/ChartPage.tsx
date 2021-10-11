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

import {  useState, VoidFunctionComponent, FunctionComponent } from "react";
import * as Echarts from 'echarts'
import React from "react";
import { Button, Card, Form, ListGroup } from "react-bootstrap";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import { ChartPanel } from "../Components/ChartPanel";

const ColorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
		  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
		  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
		  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
		  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
		  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
		  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
		  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
		  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
		  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

type CodeSelectorProps =
    {
        onSet: (leftAxisCodeList: WebsocketParameterCode[], rightAxisCodeList: WebsocketParameterCode[]) => void
    }

const CodeSelector: FunctionComponent<CodeSelectorProps> = (p) => {
    const [selectedCode, setSelectedCode] = useState<WebsocketParameterCode>();
    const [leftAxisCodeList, setLeftAxisCodeList] = useState<WebsocketParameterCode[]>([]);
    const [rightAxisCodeList, setRightAxisCodeList] = useState<WebsocketParameterCode[]>([]);
    const [availableCodeList, setAvailableCodeList] = useState<WebsocketParameterCode[]>([]);

    const codeListItems = availableCodeList.map(c => <option key={c}>{c}</option>);
    const leftAxisCodeListItems = leftAxisCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);
    const rightAxisCodeListItems = rightAxisCodeList.map(i => <ListGroup.Item key={i}>{i}</ListGroup.Item>);

    const getAvailableCodeList = async () =>
    {
        const codeList: WebsocketParameterCode[] = await(await fetch("/api/store/codelist")).json();
        setAvailableCodeList(codeList);
        setSelectedCode(codeList[0]);
    }

    const handleAddLeft = () => {
        if(selectedCode === undefined)
            return;
        const newEnabledCode = [...leftAxisCodeList];  // Need to re-create array to update DOM.
        if(!newEnabledCode.includes(selectedCode))
            newEnabledCode.push(selectedCode);
        setLeftAxisCodeList(newEnabledCode);
    };

    const handleAddRight = () => {
        if(selectedCode === undefined)
            return;
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
                        <Button variant="primary" onClick={getAvailableCodeList}>Get code list</Button>
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

    const handleAddChart = async (leftAxisCodeList: WebsocketParameterCode[], rightAxisCodeList: WebsocketParameterCode[]) => {
        const res = await fetch("/api/store");
        const dataStore: { time: number[], value: { [key: string]: number[] } } = await res.json();

        const yAxisOption: Echarts.EChartOption.YAxis[] = [];
        const seriesOption: Echarts.EChartOption.Series[] = [];

        let axisIndex = 0;
        let leftAxisIndex = 0;
        for (let code of leftAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, nameLocation:'center', nameGap:40, position:'left', offset: leftAxisIndex*80, axisLine: {show: true, lineStyle: {color: ColorArray[axisIndex]}}});
            seriesOption.push({ data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
            leftAxisIndex++;
        }
        let rightAxisIndex = 0;
        for (let code of rightAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, nameLocation:'center', nameGap:40, position:'right' ,offset: rightAxisIndex*80, axisLine: {show: true, lineStyle: {color: ColorArray[axisIndex]}}});
            seriesOption.push({ data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
            rightAxisIndex++;
        }

        const option: Echarts.EChartOption = {
            color:ColorArray,
            tooltip: {
                show: true,
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: dataStore.time,
                name: 'time(sec)',
                nameLocation : 'center',
                nameGap : 30,
                axisLabel : {
                    formatter: (x: number) => Math.floor(x*10)/10
                }

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
                charts.push(<ChartPanel  option={chartOptions[i]} onClose={()=>handleRemoveChart(i)} />);
            return charts;
        }
    }
    
    return (
        <>
            <CodeSelector onSet={(leftAxisCodeList, rightAxisCodeList)=>handleAddChart(leftAxisCodeList, rightAxisCodeList) } />
            {chartElem()}
        </>
    )
}