import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { ControlPage } from 'SubPages/ControlPage';
import { ChartPage } from 'SubPages/ChartPage';

const run = async () => {
    const container = document.getElementById('contents');
    
    const parameterCodeListToSelect = await(await fetch('/api/setting/available_code_list')).json();
    const appState = await(await fetch("/api/state")).json();
    const chartElem = <ChartPage />; 
    const controlElem = <ControlPage initialState={appState} parameterCodeListToSelect={parameterCodeListToSelect}/>;
    const root = createRoot(container!); 
    root.render
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
                <Routes>
                    <Route path="/" element={controlElem} />
                    <Route path="/control" element={controlElem} />
                    <Route path="/chart" element={chartElem} />
                </Routes>
            </HashRouter>                
            </>
        );
};

(async function main() {
    await run();
})();


