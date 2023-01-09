import * as React from 'react'
import {useEffect, useRef, useState} from 'react'


const Hub = () => {
    // const [redirectUri, _] = useState<string>(defaultRedirectUri);
    // const redirectUriInputRef = useRef<HTMLInputElement>(null);

    // TODO: Store extension name, icon, etc.
    const [connections, setConnections] = useState<string[]>([]);
    const [checked, setChecked] = useState<boolean>(false);
    const [requestAutoRun, setRequestAutoRun] = useState<boolean>(true);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log(message);
        return false;
    });
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
        if (requestAutoRun) {
            connections.forEach(
                connection => {
                    const port = chrome.runtime.connect(connection);
                    port.postMessage({
                        action: "request_auto_run",
                    })
                    setRequestAutoRun(false);
                }
            )

        }
    })

    return (
        <>
            <div>Hub goes here!</div>
            <div>{connections}</div>
        </>
    );
};

export default Hub;