import React, { useEffect, useState, VoidFunctionComponent } from 'react';
import ReactDOM from 'react-dom';
import * as Echarts from 'echarts'
import { RunCommandControl } from 'lib/DataLogger/View/Parts/RunCommandControl';
import { WebsocketParameterCode } from 'lib/MeterAppBase/WebsocketObjCollection/WebsocketParameterCode';
import ReactEcharts from 'echarts-for-react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { StateModel } from 'lib/DataLogger/Model/StateModel';
import { RunStateControl } from 'lib/DataLogger/View/Parts/RunStateControl';

const ControlPage : VoidFunctionComponent = () => {
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

const run = async () => {
    const container = document.getElementById('contents');
    const host = location.host;
    const res = await fetch("http://" + host + "/api/store");
    const dataStore: { time: number[], value: { [key: string]: number[] } } = await res.json();

    const yAxisOption: Echarts.EChartOption.YAxis[] = [];
    const seriesOption: Echarts.EChartOption.Series[] = [];
    let axisIndex = 0;
    for (let code in dataStore.value) {
        yAxisOption.push({ type: 'value', name: code });
        seriesOption.push({ data: dataStore.value[code], type: 'line', yAxisIndex: axisIndex });
        axisIndex++;
    }

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

    const chartElem = () => (seriesOption.length == 0) ? 
                    (<div>Data is not available.</div>) 
                    :
                    (<ReactEcharts
                        option={option}
                        notMerge={true}
                        lazyUpdate={true}
                        theme={"theme_name"}
                        //onChartReady={this.onChartReadyCallback}
                        //onEvents={EventsDict}
                        //opts={ }
                    />);

    const controlElem = () =>  
            <ControlPage />;

    ReactDOM.render
        (
            <>
            <HashRouter>
                <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand>Main</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#control">Control</Nav.Link>
                        <Nav.Link href="#chart">Chart</Nav.Link>
                    </Nav>
                    </Navbar.Collapse>
                </Container>
                </Navbar>
                <Switch>
                    <Route exact path="/control" component={controlElem} />
                    <Route exact path="/chart" component={chartElem} />
                </Switch>
            </HashRouter>                
            </>
            , container);
};

(async function main() {
    await run();
})();


/*
ReactDOM.render(<canvas id="chartmain" width="1024" height="768"></canvas>, container, async () =>
{
    const chartdom = document.getElementById("chartmain") as HTMLCanvasElement;
    const mychart =  Echarts.init(chartdom);
    const host = location.host;
    const res = await fetch("http://" + host + "/test");
    const dataStore : {time:number[], value: {[key : string] : number[]}} = await res.json();

    const yAxisOption : Echarts.EChartOption.YAxis[] = [];
    const seriesOption : Echarts.EChartOption.Series[] = [];
    let axisIndex = 0;
    for(let code in dataStore.value)
    {
        yAxisOption.push({type:'value', name:code});
        seriesOption.push({data:dataStore.value[code], type:'line', yAxisIndex:axisIndex});
        axisIndex++;
    }
    const option : Echarts.EChartOption = {
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
         /*,
        yAxis: {
            type: 'value'
        },
        series: [{
            data: dataStore.value,
            type: 'line'
        }]*/
//    };

//    option && mychart.setOption(option);    
//});

