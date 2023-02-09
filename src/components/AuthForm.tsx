import * as React from 'react'
import {useEffect, useRef, useState} from 'react'
import './AuthForm.css';

type Props = {
    redirectUri: string
    onSubmit: (params: AuthInputParams) => void
}

enum AuthStep {
    EnterURL = 0,
    AcceptPerms,
    OpenProfile ,
    PasteRedirectUrl,
    PasteClientId,
    Review,
    AuthFlow,

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

    chrome.storage.local.get({firefly_iii_auth_step: AuthStep.EnterURL.valueOf()}, data => setAuthStep(data.firefly_iii_auth_step));
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
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "result") {
                chrome.runtime.openOptionsPage();
            }
            return true;
        });

        return () => {
            chrome.runtime.onMessage.removeListener(() => {
            });
        }
    }, [copyButtonText]);

    const handleButtonClick = function () {
        switch (authStep) {
            case AuthStep.EnterURL:
                setAndStoreAuthStep(authStep + 1);
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
                return;
            case AuthStep.PasteClientId:
                chrome.runtime.sendMessage({
                    action: 'set_client_id',
                    value: clientId,
                }).then(() => {
                    setAndStoreAuthStep(authStep + 1);
                })
                return
            case AuthStep.Review:
                onSubmit({
                    apiBaseURL: baseURL,
                    authorizationEndpoint: `${(baseURL)}/oauth/authorize`,
                    tokenEndpoint: `${(baseURL)}/oauth/token`,
                    clientId: clientId,
                    redirectUri: redirectUri,
                });
                setAndStoreAuthStep(authStep + 1);
                return;
            case AuthStep.AuthFlow:
                onSubmit({
                    apiBaseURL: baseURL,
                    authorizationEndpoint: `${(baseURL)}/oauth/authorize`,
                    tokenEndpoint: `${(baseURL)}/oauth/token`,
                    clientId: clientId,
                    redirectUri: redirectUri,
                });
                return;
            default:
                setAndStoreAuthStep(authStep + 1);
                return
        }
    }

    const isButtonDisabled = () => {
        switch (authStep) {
            case AuthStep.EnterURL:
                return !baseURL;
            case AuthStep.PasteClientId:
                return !clientId;
        }
        return false;
    }

    const getButtonText= () => {
        switch (authStep) {
            case AuthStep.Review:
                return "Confirm"
            case AuthStep.AuthFlow:
                return "Retry"
        }
        return "Next step"
    }

    return (
        <>
            {authStep == AuthStep.EnterURL &&
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
                </table>
            }
            {authStep === AuthStep.AcceptPerms &&
                <table>
                    <tr className={"text-row"}>
                        <td>
                            <span>Step 1.5: Accept the permissions</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div><img src={chrome.runtime.getURL("walkthrough/perm.png")}/></div>
                        </td>
                    </tr>
                    <tr className={"text-row"}>
                        <td>
                            This may have opened on a different chrome window. Check them all.
                        </td>
                    </tr>
                </table>
            }
            {authStep === AuthStep.OpenProfile &&
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
                </table>
            }
            {authStep === AuthStep.PasteRedirectUrl &&
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
                </table>
            }
            {authStep === AuthStep.PasteClientId &&
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
                </table>
            }
            {authStep === AuthStep.Review &&
                <>
                    <div>Review the information:</div>
                    <ul>
                        <li>Firefly III URL: {baseURL}</li>
                        <li>Client ID: {clientId}</li>
                    </ul>
                </>
            }
            {authStep === AuthStep.AuthFlow &&
                <>
                    <div>A login window has opened (it might be on a different monitor)</div>
                    <div>Enter your login information and authorize this extension</div>
                    {/* TODO: Make this click not necessary */}
                    <div>If this page doesn't change, click "retry" below</div>
                </>
            }
            <div className={"buttons"}>
                <button disabled={isButtonDisabled()} onClick={() => handleButtonClick()}>{getButtonText()}</button>
                <button onClick={() => setAndStoreAuthStep(0)}>Start over</button>
            </div>
        </>
    );
};

export default AuthForm;