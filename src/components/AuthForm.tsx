import * as React from 'react'
import {useEffect, useRef, useState} from 'react'
import './AuthForm.css';
import {
    Alert,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Divider, List, ListItemText,
    Stack,
    TextField,
    Typography
} from "@mui/material";

type Props = {
    redirectUri: string
    onSubmit: (params: AuthInputParams) => void
}

enum AuthStep {
    EnterURL = 0,
    AcceptPerms,
    OpenProfile,
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

    const getButtonText = () => {
        switch (authStep) {
            case AuthStep.Review:
                return "Confirm"
            case AuthStep.AuthFlow:
                return "Retry"
        }
        return "Next step"
    }

    return (
        <Card>
            <CardContent>
                <Typography variant={"h5"}>
                    Setup Wizard
                </Typography>

                <Stack spacing={2} mt={2}>
                    {authStep == AuthStep.EnterURL &&
                        <Typography variant={"subtitle1"}>
                            Step 1: Enter the URL you see when you open Firefly III (Including http:// or https://)
                        </Typography>
                    }
                    {authStep === AuthStep.AcceptPerms &&
                        <Typography variant={"subtitle1"}>
                            Step 1.5: Accept the permissions
                        </Typography>
                    }
                    {authStep === AuthStep.OpenProfile &&
                        <div className={"top-with-button"}>
                            <Typography variant={"subtitle1"}>
                                Step 2: Navigate to "profile" on your Firefly III instance
                            </Typography>
                            <div className={"spacer"}></div>
                            <Button variant={"contained"}>
                                Open in new tab
                            </Button>
                        </div>
                    }
                    {authStep === AuthStep.PasteRedirectUrl &&
                        <Typography variant={"subtitle1"}>
                            Step 3: Click "Create Client" and copy this URL to the "Redirect URL" box
                        </Typography>
                    }
                    {authStep === AuthStep.PasteClientId &&
                        <Typography variant={"subtitle1"}>
                            Step 4: After creating the client, copy the Client ID and paste it on this extension
                            page in the box below.
                        </Typography>
                    }
                    {authStep === AuthStep.Review &&
                        <Typography variant={"subtitle1"}>
                            Review the information:
                        </Typography>
                    }

                    <div>
                        {authStep == AuthStep.EnterURL &&
                            <img src={chrome.runtime.getURL("walkthrough/url.png")}></img>
                        }
                        {authStep === AuthStep.AcceptPerms &&
                            <img src={chrome.runtime.getURL("walkthrough/perm.png")}/>
                        }
                        {authStep === AuthStep.OpenProfile &&
                            <img src={chrome.runtime.getURL("walkthrough/nav-profile.png")}/>
                        }
                        {authStep === AuthStep.PasteRedirectUrl &&
                            <img src={chrome.runtime.getURL("walkthrough/create-client.png")}/>
                        }
                        {authStep === AuthStep.PasteClientId &&
                            <img src={chrome.runtime.getURL("walkthrough/client-id.png")}/>
                        }
                    </div>

                    {authStep == AuthStep.EnterURL &&
                        <>
                            <TextField
                                fullWidth
                                autoComplete={"on"}
                                margin={"normal"}
                                label="Firefly III URL"
                                value={baseURL}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setBaseURL(event.target.value);
                                }}
                                placeholder="https://firefly.local"
                            />
                            <Alert severity="info">Your browser will prompt you to accept new permissions.</Alert>
                        </>
                    }
                    {authStep === AuthStep.AcceptPerms &&
                        <>
                            <Alert severity="warning">This may have opened on a different chrome window. Check them
                                all.</Alert>
                        </>
                    }
                    {authStep === AuthStep.OpenProfile &&
                        <>
                            <Typography variant={"subtitle1"}>
                                Navigate to "OAuth" on your Firefly III instance:
                            </Typography>
                            <div><img src={chrome.runtime.getURL("walkthrough/nav-oauth.png")}/></div>
                        </>
                    }
                    {authStep === AuthStep.PasteRedirectUrl &&
                        <>
                        <table>
                            <tbody>
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
                            </tbody>
                        </table>
                        <Alert severity="warning">
                            IMPORTANT: Mark the client as NOT confidential
                        </Alert>
                        </>
                    }
                    {authStep === AuthStep.PasteClientId &&
                        <table>
                            <tbody>
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
                            </tbody>
                        </table>
                    }
                    {authStep === AuthStep.Review &&
                        <List>
                            <ListItemText primary={baseURL} key={"url"} secondary={"Firefly III URL"}/>
                            <ListItemText primary={clientId} key={"client_id"} secondary={"Client ID"}/>
                        </List>
                    }
                    {authStep === AuthStep.AuthFlow &&
                        <>
                            <div>A login window has opened (it might be on a different monitor)</div>
                            <div>Enter your login information and authorize this extension</div>
                            {/* TODO: Make this click not necessary */}
                            <div>If this page doesn't change, click "retry" below</div>
                        </>
                    }
                </Stack>
            </CardContent>
            <CardActions>
                <Button variant={"contained"} disabled={isButtonDisabled()}
                        onClick={() => handleButtonClick()}>{getButtonText()}</Button>
                <Button onClick={() => setAndStoreAuthStep(0)}>Start over</Button>
            </CardActions>
        </Card>
    );
}

export default AuthForm;