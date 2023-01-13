import * as React from 'react'
import {useEffect, useRef, useState} from 'react'


const Hub = () => {
    // TODO: Store extension connection names, icons, etc.
    const [connections, setConnections] = useState<string[]>([]);
    const [checked, setChecked] = useState<boolean>(false);

    useEffect(() => {
        if (!checked) {
            chrome.runtime.sendMessage(
                {
                    action: "get_connections",
                },
                (c: string[]) => {
                    setConnections(c);
                },
            );
            setChecked(true);
        }
    })

    return (
        <>
            <div>Welcome to the Firefly III Extension Hub!</div>
            <div>Connections:</div>
            <ul>
                {connections.map(c => (
                    <li>{c}</li>
                ))}
            </ul>
            <button onClick={() => {
                connections.forEach(
                    connection => {
                        const port = chrome.runtime.connect(connection);
                        port.postMessage({
                            action: "request_auto_run",
                        })
                    }
                );
            }}>Run auto-export for all connections</button>
        </>
    );
};

export default Hub;