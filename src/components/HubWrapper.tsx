import * as React from 'react'
import {useState} from 'react'
import Hub from "./Hub";
import './HubWrapper.css';
import AuthForm from "./AuthForm";

const debug = true;

const HubWrapper = () => {
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`

    const [loggedIn, setLoggedIn] = useState<boolean>(false);

    chrome.notifications.onButtonClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
    })

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "result") {
            setLoggedIn(!!message.value);
        }
    });

    chrome.runtime.sendMessage({
        action: 'check_logged_in',
    }).then(setLoggedIn);

    return (
        <div className={"hub"}>
            {loggedIn
                ? <>
                    <Hub/>
                    <button onClick={() => {
                        setLoggedIn(false);
                    }}>Log Out
                    </button>
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