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
                        <button onClick={() => {
                            chrome.permissions.request({
                                origins: [`${baseURL}/*`],
                            }, () => {
                                chrome.runtime.sendMessage({
                                    action: 'set_api_base_url',
                                    value: baseURL,
                                }).then(() => {
                                    setAuthStep(authStep + 1);
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
                            Step 2: Navigate to "profile" on your Firefly III instance:
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/nav-profile.png")}/></div>
                        </td>
                    </tr>
                    <tr className={"text-row"}>
                        <td>
                            Step 3: Navigate to "OAuth" on your Firefly III instance:
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/nav-oauth.png")}/></div>
                        </td>
                    </tr>
                    <tr>
                        <button onClick={() => {
                            setAuthStep(authStep + 1);
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
                            <div><img src={chrome.runtime.getURL("walkthrough/create-client.png")}/></div>
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
                            IMPORTANT: Mark the client as NOT confidential
                        </td>
                    </tr>
                    <tr>
                        <button onClick={() => {
                            setAuthStep(authStep + 1);
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
                                setAuthStep(authStep + 1);
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
                        setAuthStep(authStep + 1);
                    }}>Confirm</button>
                </>
            }
            {authStep === 5 &&
                <>
                    <div>A login window has opened (it might be on a different monitor)</div>
                    <div>Enter your login information and authorize this extension</div>
                </>
            }
        </>
    );
};

export default AuthForm;