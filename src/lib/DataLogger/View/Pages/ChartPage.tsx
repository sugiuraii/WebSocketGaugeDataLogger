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

import { useEffect, useState, VoidFunctionComponent } from "react";
import * as Echarts from 'echarts'
import ReactEcharts from 'echarts-for-react'
import React from "react";
import { Button, Form, ListGroup } from "react-bootstrap";
import { WebsocketParameterCode } from "lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode";

export const ChartPage : VoidFunctionComponent = () => 
{
    const [chartOption, setChartOption] = useState<Echarts.EChartOption>();
    const [codeList, setCodeList] = useState<WebsocketParameterCode[]>([]);

    // Query code list of store when the element is mounted
    useEffect( () => {
        let cleanedUp = false;
        fetch("/api/store/codelist").then(res => res.json().then( (obj : WebsocketParameterCode[])  => { 
            if(obj.length !== 0) // No code list => No data.
            {
                if(!cleanedUp)
                    setCodeList([...obj]);
            }
        }));
        const cleanUp = () => {cleanedUp = true};
        return cleanUp;
    }, []);

    const codeListItems = codeList.map(c => <option key={c}>{c}</option>);

    const handleGetData = async () =>
    {
        const res = await fetch("/api/store");
        const dataStore: { time: number[], value: { [key: string]: number[] } } = await res.json();
    
        const yAxisOption: Echarts.EChartOption.YAxis[] = [];
        const seriesOption: Echarts.EChartOption.Series[] = [];
        let axisIndex = 0;

        for (let code in dataStore.value) {
            yAxisOption.push({ type: 'value', name: code });
            seriesOption.push({ data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
            axisIndex++;
        }
        /*
        if(axisIndex == 0) // No data
        {
            setChartOption(undefined);
            return;            
        }
        */
        const option: Echarts.EChartOption = {
            tooltip: {
                show: true,
                trigger: 'axis'//,
                //position: function (pt) {
                //    return [pt[0], '10%'];
                //}
            },
            xAxis: {
                type: 'category',
                data: dataStore.time
            },
            yAxis: yAxisOption,
            series: seriesOption
            /*
            yAxis: {
                type: 'value'
            },
            series: [{
                data: dataStore.value,
                type: 'line'
            }]
            */
        };
        
        setChartOption(option);
    }
 
    const chartElem = (chartOption === undefined) ? 
                    (<div>Data is not available.</div>) 
                    :
                    (<ReactEcharts
                        option={chartOption}
                        notMerge={true}
                        lazyUpdate={true}
                        theme={"theme_name"}
                        //onChartReady={this.onChartReadyCallback}
                        //onEvents={EventsDict}
                        //opts={ }
                    />);
        
    return(
        <>
            <Form.Control as="select" >
                {codeListItems}
            </Form.Control>
            {chartElem}
            <Button variant="primary" onClick={handleGetData}>Get data</Button>
        </>
    )
}