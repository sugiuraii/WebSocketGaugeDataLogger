import React from 'react';
import ReactDOM from 'react-dom';
import * as Echarts from 'echarts'
import ReactEcharts from 'echarts-for-react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { ControlPage } from 'pages/SubPages/ControlPage';
import { ChartPage } from 'pages/SubPages/ChartPage';

const run = async () => {
    const container = document.getElementById('contents');
    
    const parameterCodeListToSelect = await(await fetch('/api/setting/available_code_list')).json();
    const appState = await(await fetch("/api/state")).json();
    const chartElem = () => <ChartPage />; 
    const controlElem = () => <ControlPage initialState={appState} parameterCodeListToSelect={parameterCodeListToSelect}/>;

    ReactDOM.render
        (
            <>
            <HashRouter>
                <Navbar bg="light" expand="lg">
                <Container fluid>
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
                    <Route exact path="/"><Redirect to="/control" /></Route>
                    <Route exact path="/control" component={controlElem} />
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


