import * as React from 'react'
import {useEffect, useState} from 'react'
import {Connection} from "../common/connection";

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
        <div className={"hub"}>
            <div>Welcome to the Firefly III Extension Hub!</div>
            <div>Connections:</div>
            {connections?.length === 0 &&
                <div>No connections found. Try reloading your scraper extension(s) and then reload this page.</div>
            }
            <ul>
                {connections.map(c => (
                    <li>{c.name}</li>
                ))}
            </ul>
            <button disabled={connections?.length === 0} onClick={() => {
                connections.forEach(
                    connection => {
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
            </button>

            {debug &&
                <>
                    <button onClick={() => {
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
                    </button>
                </>
            }
        </div>
    );
};

export default Hub;