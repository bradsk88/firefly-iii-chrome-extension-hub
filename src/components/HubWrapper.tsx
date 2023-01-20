import * as React from 'react'
import {useState} from 'react'
import Hub from "./Hub";
import './HubWrapper.css';
import AuthForm from "./AuthForm";

const HubWrapper = () => {
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`

    const [loggedIn, setLoggedIn] = useState<boolean>(false);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "result") {
            setLoggedIn(!!message.value);
        }
        return true;
    });

    chrome.runtime.sendMessage({
        action: 'check_logged_in',
    }).then((li) => {
        setLoggedIn(li);
    });

    return (
        <div className={"hub"}>
            {loggedIn
                ? <>
                    <Hub/>
                </>
                : <AuthForm
                    redirectUri={redirectUri}
                    onSubmit={(params) => {
                        chrome.runtime.sendMessage(
                            {
                                action: "submit",
                                value: params,
                            },
                            () => {
                            }
                        );
                    }}
                />
            }
        </div>
    );
};

export default HubWrapper;