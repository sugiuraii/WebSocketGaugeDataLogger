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
import { Col, Container, Row } from "react-bootstrap";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";
import { ChartPanel } from "./components/ChartPanel";
import { CodeSelector } from "./components/CodeSelector"

export const ChartPage: FunctionComponent = () => {
    const [chartOptions, setChartOptions] = useState<Echarts.EChartOption[]>([]);
    const [codeToSelect, setCodeToSelect] = useState<WebsocketParameterCode[]>([]);

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
        const res = await fetch("/api/store");
        const dataStore: { time: number[], value: { [key: string]: number[] } } = await res.json();

        const yAxisOption: Echarts.EChartOption.YAxis[] = [];
        const seriesOption: Echarts.EChartOption.Series[] = [];

        let axisIndex = 0;
        let leftAxisIndex = 0;
        for (let code of leftAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, nameLocation: 'center', nameGap: 40, position: 'left', offset: leftAxisIndex * 80, axisLine: { show: true } });
            seriesOption.push({ name: code, data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
            leftAxisIndex++;
        }
        let rightAxisIndex = 0;
        for (let code of rightAxisCodeList) {
            yAxisOption.push({ type: 'value', name: code, nameLocation: 'center', nameGap: 40, position: 'right', offset: rightAxisIndex * 80, axisLine: { show: true } });
            seriesOption.push({ name: code, data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
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
            xAxis: {
                type: 'category',
                data: dataStore.time,
                name: 'time(sec)',
                nameLocation: 'center',
                nameGap: 30,
                axisLabel: {
                    formatter: (x: number) => Math.floor(x * 10) / 10
                }

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