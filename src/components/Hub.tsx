import * as React from 'react'
import {useEffect, useState} from 'react'

const debug = true;

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

    chrome.notifications.onButtonClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
    })

    return (
        <div className={"hub"}>
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