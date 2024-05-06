import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { ControlPage } from 'SubPages/controlpage/ControlPage';
import { ChartPage } from 'SubPages/chartpage/ChartPage';
import axios from 'axios';

const run = async () => {
    const container = document.getElementById('contents');
    
    const parameterCodeListToSelect = (await axios.get('/api/setting/available_code_list')).data;
    const appState = (await axios.get("/api/state")).data;
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


