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

import { useState, FunctionComponent, useEffect } from "react";
import * as Echarts from 'echarts'
import React from "react";
import { Card, Col, Container, Form, Row } from "react-bootstrap";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import { ChartPanel } from "./components/ChartPanel";
import { CodeSelector } from "./components/CodeSelector"

export const ChartPage: FunctionComponent = () => {
    const [chartOptions, setChartOptions] = useState<Echarts.EChartOption[]>([]);
    const [codeToSelect, setCodeToSelect] = useState<WebsocketParameterCode[]>([]);
    const [isTimeAxisElapsed, setTimeAxisElapsed] = useState<boolean>(false);

    useEffect(() => {
        let cleanedUp = false;
        fetch("/api/store/codelist").then(res => res.json().then(obj => {
            if (!cleanedUp)
                setCodeToSelect(obj);
        }));
        const cleanUp = () => { cleanedUp = true };
        return cleanUp;
    }, []);

    const handleAddChart = async (leftAxisCodeList: WebsocketParameterCode[], rightAxisCodeList: WebsocketParameterCode[]) => {
        if(leftAxisCodeList.length == 0 && rightAxisCodeList.length == 0) {
            alert("Set parameter code for left or right axis.");
            return;
        }
        
        const res = await fetch("/api/store");
        const dataStore: { time: number[], value: { [key: string]: number[] } } = await res.json();
        const startTime = dataStore.time[0];
        const valueTimeStore = new Map(Object.keys(dataStore.value).map(k => [k, dataStore.value[k].map((v, i)  => [new Date(dataStore.time[i]).toISOString(), v])]));
        const valueElapsedSecStore = new Map(Object.keys(dataStore.value).map(k => [k, dataStore.value[k].map((v, i)  => [(dataStore.time[i] - startTime)/1000, v])]));

        const yAxisOption: Echarts.EChartOption.YAxis[] = [];
        const seriesOption: Echarts.EChartOption.Series[] = [];

        let axisIndex = 0;
        let leftAxisIndex = 0;
        for (let code of leftAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, nameLocation: 'center', nameGap: 40, position: 'left', offset: leftAxisIndex * 80, axisLine: { show: true } });
            seriesOption.push({ name: code, data: isTimeAxisElapsed?valueElapsedSecStore.get(code):valueTimeStore.get(code), type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
            leftAxisIndex++;
        }
        let rightAxisIndex = 0;
        for (let code of rightAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, nameLocation: 'center', nameGap: 40, position: 'right', offset: rightAxisIndex * 80, axisLine: { show: true } });
            seriesOption.push({ name: code, data: isTimeAxisElapsed?valueElapsedSecStore.get(code):valueTimeStore.get(code), type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
            rightAxisIndex++;
        }

        const option: Echarts.EChartOption = {
            legend: { show: true },
            tooltip: {
                show: true,
                trigger: 'axis'
            },
            grid: {
                left: 80 * leftAxisIndex,
                right: 80 * rightAxisIndex
            },
            toolbox: {
                feature: {
                    dataView: { show: true, readOnly: false },
                    restore: { show: true },
                    dataZoom: { yAxisIndex: 'none' },
                    saveAsImage: { show: true }
                }
            },
            xAxis: isTimeAxisElapsed?
            {
                type: 'value',
                name: 'elapsed time(sec)',
                nameLocation: 'center',
                nameGap: 30
            }:
            {
                type: 'time',
                name: 'time stamp',
                nameLocation: 'center',
                nameGap: 30
            },
            yAxis: yAxisOption,
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    start: 0,
                    end: 100
                }
            ],
            series: seriesOption
        };

        const newChartOptions = [...chartOptions];
        newChartOptions.push(option);
        setChartOptions(newChartOptions);
    }

    const handleRemoveChart = (index: number) => {
        const newChartOptions = [...chartOptions];
        newChartOptions.splice(index, 1);
        setChartOptions(newChartOptions);
    }

    const chartElem = () => {
        if (chartOptions.length === 0)
            return (<div>Data is not available.</div>);
        else {
            const charts: JSX.Element[] = [];
            for (let i = 0; i < chartOptions.length; i++)
                charts.push(<ChartPanel key={i} option={chartOptions[i]} onClose={() => handleRemoveChart(i)} />);
            return charts;
        }
    }

    return (
        <>
            <Container fluid>
                <Row>
                    <Col sm={4}>
                        <Card>
                            <Card.Header>Time axis settings</Card.Header>
                            <Card.Body>
                                <Form.Check
                                    type='switch'
                                    id={`timeAxisElapsedSwitch`}
                                    label={isTimeAxisElapsed?`Elapsed time(sec)`:`Epoch Unix Timestamp`}
                                    onChange={e => setTimeAxisElapsed(!isTimeAxisElapsed)}
                                />
                            </Card.Body>
                        </Card>
                        <CodeSelector codeToSelect={codeToSelect} onSet={(leftAxisCodeList, rightAxisCodeList) => handleAddChart(leftAxisCodeList, rightAxisCodeList)} />
                    </Col>
                    <Col sm={8}>
                        {chartElem()}
                    </Col>
                </Row>
            </Container>
        </>
    )
}