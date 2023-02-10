import * as React from 'react'
import {useEffect, useState} from 'react'
import {Connection} from "../common/connection";
import {Button, Card, CardActions, CardContent, List, ListItem, ListSubheader} from "@mui/material";
import './Hub.css';

const debug = false;

const Hub = () => {
    // TODO: Store extension connection names, icons, etc.
    const [connections, setConnections] = useState<Connection[]>([]);
    const [checked, setChecked] = useState<boolean>(false);

    useEffect(() => {
        if (!checked) {
            chrome.runtime.sendMessage(
                {
                    action: "get_connections",
                },
                (c: Connection[]) => {
                    setConnections(c);
                },
            );
            setChecked(true);
        }
    })

    chrome.notifications.onButtonClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
    })

    return (
        <Card>
            <CardContent>
                <h1>Firefly III Extension Hub</h1>
                <List>
                    <ListSubheader>Connections:</ListSubheader>
                {connections?.length === 0 &&
                    <ListItem>No connections found. Try reloading your scraper extension(s) and then reload this page.</ListItem>
                }
                {connections.map(c => (
                    <ListItem className={"connection"}>
                        <div>{c.name}</div>
                        <div className={"spacer"}></div>
                        <Button
                            variant={"contained"}
                            onClick={() => {
                                const port = chrome.runtime.connect(c.id);
                                port.postMessage({
                                    action: "request_auto_run",
                                })
                            }}
                        >Auto-Run</Button>
                    </ListItem>
                ))}
                </List>
            </CardContent>
            <CardActions>
                <Button variant={"contained"} disabled={connections?.length === 0} onClick={() => {
                    connections.forEach(
                        connection => {
                            // TODO: Add "cancel auto run" button
                            const port = chrome.runtime.connect(connection.id);
                            port.postMessage({
                                action: "request_auto_run",
                            })
                        }
                    );
                    chrome.storage.local.set({
                        firefly_iii_last_run: new Date(),
                    })
                }}>Run auto-export for all connections
                </Button>

                <Button onClick={() => {
                    chrome.runtime.sendMessage(
                        {
                            action: "refresh_auth",
                        },
                        () => {
                        },
                    );
                }}>
                    Refresh Auth
                </Button>

                {debug &&
                    <>
                        <Button onClick={() => {
                            chrome.notifications.create("", {
                                iconUrl: "logo-128.png",
                                message: "It's been over a week since your last export!",
                                type: "basic",
                                title: "Weekly transaction export",
                                buttons: [{
                                    title: "Click to open"
                                }],
                            })
                        }}>Test Notification
                        </Button>
                    </>
                }
            </CardActions>
        </Card>
    );
};

export default Hub;