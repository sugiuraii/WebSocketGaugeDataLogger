import React from 'react';
import ReactDOM from 'react-dom';
import * as Echarts from 'echarts'
import ReactEcharts from 'echarts-for-react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { ControlPage } from 'lib/DataLogger/View/Pages/ControlPage';
import { ChartPage } from 'lib/DataLogger/View/Pages/ChartPage';

const run = async () => {
    const container = document.getElementById('contents');
    
    const parameterCodeListToSelect = await(await fetch('/api/setting/available_code_list')).json();
    const chartElem = () => <ChartPage />; 
    const controlElem = () => <ControlPage parameterCodeListToSelect={parameterCodeListToSelect}/>;

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

