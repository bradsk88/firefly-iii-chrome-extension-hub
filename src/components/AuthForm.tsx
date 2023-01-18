import * as React from 'react'
import {useEffect, useRef, useState} from 'react'
import './AuthForm.css';

type Props = {
    redirectUri: string
    onSubmit: (params: AuthInputParams) => void
}

const AuthForm = (props: Props) => {
    const {redirectUri: defaultRedirectUri, onSubmit} = props;

    const [baseURL, setBaseURL] = useState<string>("");
    const [clientId, setClientId] = useState<string>("");
    const [redirectUri, _] = useState<string>(defaultRedirectUri);
    const [authStep, setAuthStep] = useState<number>(0);

    const setAndStoreAuthStep = (n: number) => {
        setAuthStep(n);
        chrome.storage.local.set({
            firefly_iii_auth_step: n,
        })
    }

    chrome.storage.local.get({firefly_iii_auth_step: 0}, data => setAuthStep(data.firefly_iii_auth_step));
    if (!baseURL || !clientId) {
        chrome.runtime.sendMessage({action: "get_auth"}, auth => {
            if (!baseURL) {
                setBaseURL(auth.apiBaseUrl);
            }
            if (!clientId) {
                setClientId(auth.clientId);
            }
        })
    }

    const [copyButtonText, setCopyButtonText] = useState("copy");

    const redirectUriInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => {
            setCopyButtonText("copy");
        }, 1000);
    }, [copyButtonText]);

    return (
        <>
            {authStep == 0 &&
                <table>
                    <tr className={"text-row"}>
                        <td>
                            Step 1: Enter the URL you see when you open Firefly III (Including http:// or https://)
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/url.png")}/></div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <fieldset>
                                <div>
                                    <label htmlFor="base_url">
                                        Firefly III URL
                                    </label>
                                    <input
                                        type="url"
                                        name="base_url"
                                        placeholder="https://firefly.local"
                                        size={40}
                                        form="form"
                                        required
                                        value={baseURL}
                                        onChange={(e) => setBaseURL(e.target.value)}
                                    />
                                </div>
                            </fieldset>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Your browser will prompt you to accept new permissions.
                        </td>
                    </tr>
                    <tr>
                        <button disabled={baseURL?.length === 0} onClick={() => {
                            chrome.permissions.request({
                                origins: [`${baseURL}/*`],
                            }, () => {
                                chrome.runtime.sendMessage({
                                    action: 'set_api_base_url',
                                    value: baseURL,
                                }).then(() => {
                                    setAndStoreAuthStep(authStep + 1);
                                })
                            });
                        }}>Next
                        </button>
                    </tr>
                </table>
            }

            {authStep === 1 &&
                <table>
                    <tr className={"text-row"}>
                        <td>
                            <span>Step 2: Navigate to "profile" on your Firefly III instance </span>
                            <button onClick={() => window.open(`${baseURL}/profile`)}>Open in new tab</button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/nav-profile.png")}/></div>
                        </td>
                    </tr>
                    <tr className={"text-row"}>
                        <td>
                            Navigate to "OAuth" on your Firefly III instance:
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/nav-oauth.png")}/></div>
                        </td>
                    </tr>
                    <tr>
                        <button onClick={() => {
                            setAndStoreAuthStep(authStep + 1);
                        }}>Next
                        </button>
                    </tr>
                </table>
            }
            {authStep === 2 &&
                <table>
                    <tr className={"text-row"}>
                        <td>
                            Step 3: Click "Create Client" and copy this URL to the "Redirect URL" box
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <fieldset>
                                <div>
                                    <label htmlFor="redirect_uri">redirect_uri</label>
                                    <input
                                        ref={redirectUriInputRef}
                                        type="text"
                                        id="redirect_uri"
                                        name="redirect_uri"
                                        value={redirectUri}
                                        readOnly
                                        size={50}
                                    />
                                    <button
                                        id="copy_redirect_uri_button"
                                        type="button"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                                            redirectUriInputRef.current?.select();
                                            redirectUriInputRef.current?.setSelectionRange(0, 99999);
                                            document.execCommand("copy");

                                            setCopyButtonText("copied!");
                                        }}
                                    >
                                        {copyButtonText}
                                    </button>
                                </div>
                            </fieldset>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/create-client.png")}/></div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <fieldset>
                                IMPORTANT: Mark the client as NOT confidential
                            </fieldset>
                        </td>
                    </tr>
                    <tr>
                        <button onClick={() => {
                            setAndStoreAuthStep(authStep + 1);
                        }}>Next
                        </button>
                    </tr>
                </table>
            }
            {authStep === 3 &&
                <table>
                    <tr className={"text-row"}>
                        <td>
                            Step 4: After creating the client, copy the Client ID and paste it on this extension page in
                            the box below.
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/client-id.png")}/></div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <fieldset>
                                <div>
                                    <label htmlFor="base_url">
                                        Firefly III Client ID
                                    </label>
                                    <input
                                        type="text"
                                        name="client_id"
                                        placeholder="1"
                                        size={40}
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                    />
                                </div>
                            </fieldset>
                        </td>
                    </tr>
                    <tr>
                        <button onClick={() => {
                            chrome.runtime.sendMessage({
                                action: 'set_client_id',
                                value: clientId,
                            }).then(() => {
                                setAndStoreAuthStep(authStep + 1);
                            })
                        }}>Next
                        </button>
                    </tr>
                </table>
            }
            {authStep === 4 &&
                <>
                    <div>Review the information:</div>
                    <ul>
                        <li>Firefly III URL: {baseURL}</li>
                        <li>Client ID: {clientId}</li>
                    </ul>
                    <button onClick={() => {
                        onSubmit({
                            apiBaseURL: baseURL,
                            authorizationEndpoint: `${(baseURL)}/oauth/authorize`,
                            tokenEndpoint: `${(baseURL)}/oauth/token`,
                            clientId: clientId,
                            redirectUri: redirectUri,
                        });
                        setAndStoreAuthStep(authStep + 1);
                    }}>Confirm</button>
                </>
            }
            {authStep === 5 &&
                <>
                    <div>A login window has opened (it might be on a different monitor)</div>
                    <div>Enter your login information and authorize this extension</div>
                    {/* TODO: Fix this */}
                    <div>If this page doesn't change, click "retry" below</div>
                    <button onClick={() => {
                        onSubmit({
                            apiBaseURL: baseURL,
                            authorizationEndpoint: `${(baseURL)}/oauth/authorize`,
                            tokenEndpoint: `${(baseURL)}/oauth/token`,
                            clientId: clientId,
                            redirectUri: redirectUri,
                        });
                    }}>Retry
                    </button>
                </>
            }
            <button onClick={() => setAndStoreAuthStep(0)}>Start over</button>
        </>
    );
};

export default AuthForm;