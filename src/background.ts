import {createURLSearchParams, generateCodeChallenge, generateCodeVerifier} from './utils'
import notifications = chrome.contentSettings.notifications;

const weeklyExportNotificationID = "firefly-iii-chrome-extension-hub-weekly-export-notification"

chrome.notifications.onButtonClicked.addListener((id) => {
    if (id !== weeklyExportNotificationID) {
        return;
    }
    chrome.runtime.openOptionsPage();
})

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("firefly_iii_last_run", (data) => {
        const lastRun: Date = data.firefly_iii_last_run;
        const secondsSinceLastRun = new Date().getTime() - (lastRun?.getTime() || 0);
        if (secondsSinceLastRun > 7 * 24 * 60 * 60) {
            chrome.notifications.create(weeklyExportNotificationID, {
                requireInteraction: true,
                iconUrl: chrome.runtime.getURL("logo-128.png"),
                message: "It's been over a week since your last export!",
                type: "basic",
                title: "Weekly transaction export",
                buttons: [{
                    title: "Click to begin"
                }],
            })
        }
    })
})

const backgroundLog = (string: string): void => {
    chrome.runtime.sendMessage({
        action: "log",
        value: string,
    }, () => {
    });
}

const buildAuthorizationUrl = async (params: AuthInputParams, PKCECodeVerifier: string) => {
    const url = new URL(params.authorizationEndpoint)
    url.searchParams.set('client_id', params.clientId)
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('code_challenge_method', 'S256')
    const codeChallenge = await generateCodeChallenge(PKCECodeVerifier)
    url.searchParams.set('code_challenge', codeChallenge)

    return url.toString();
}

const auth = async (params: AuthInputParams) => {
    backgroundLog(`params: ${JSON.stringify(params)}`)

    const PKCECodeVerifier = generateCodeVerifier()
    backgroundLog(`generate code_verifier: ${PKCECodeVerifier}`)
    const authorizationUrl = await buildAuthorizationUrl(params, PKCECodeVerifier)
    backgroundLog(`build authorizationUrl: ${authorizationUrl}`)

    chrome.identity.launchWebAuthFlow({
        url: authorizationUrl,
        interactive: true
    }, async (callbackUrlString) => {
        if (callbackUrlString === undefined) {
            backgroundLog("[error] callbackUrlString is undefined")
            return
        } else {
            backgroundLog(`callbacked url: ${callbackUrlString}`)
        }
        const callbackUrl = new URL(callbackUrlString);
        const code = callbackUrl.searchParams.get('code');
        if (code === null) {
            backgroundLog("[error] code is null")
            return
        } else {
            backgroundLog(`code: ${code}`)
        }

        const body = createURLSearchParams({
            grant_type: 'authorization_code',
            client_id: params.clientId,
            redirect_uri: params.redirectUri,
            code: code,
            code_verifier: PKCECodeVerifier,
        })

        const response = await publicClientTokenRequest(
            params.tokenEndpoint,
            body,
        );

        try {
            JSON.stringify(response)
        } catch (e) {
            backgroundLog(`[error] got malformed json response: ${response}, error: ${e}`)
        }

        chrome.runtime.sendMessage({
            action: "result",
            value: JSON.stringify(response),
        }, () => {
        });

        // TODO: Implement refresh flow
        return chrome.storage.local.set({
            "ffiii_bearer_token": response.access_token,
            "ffiii_api_base_url": params.apiBaseURL,
        }, () => {
        });
    });
}

interface AuthInfo {
    bearerToken: string;
    apiBaseUrl: string;
}

export function getAuthInfo(): Promise<AuthInfo> {
    return chrome.storage.local.get(["ffiii_bearer_token", "ffiii_api_base_url"]).then(r => {
        if (!r.ffiii) {
            throw new Error("No auth stored");
        }
        return {
            bearerToken: r.ffiii_bearer_token,
            apiBaseUrl: r.ffiii_api_base_url,
        };
    });
}

const publicClientTokenRequest = async (tokenEndpoint: string, body: URLSearchParams) => {
    backgroundLog(`token request body for public client: ${body}`)
    const data = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: body.toString(),
    }).then(response => response.json()).then(data => {
        return data
    })
    return data
}

let registeredConnections: string[] = [];

async function getRegisteredConnections(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        resolve(registeredConnections);
    });
}

async function registerConnection(extension: string): Promise<void> {
    getRegisteredConnections().then(
        conns => {
            registeredConnections = Array.from(new Set([...conns, extension]));
        }
    )
}

chrome.runtime.onConnectExternal.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        console.log('message', msg);
        if (msg.action === "register") {
            registerConnection(msg.extension)
                .then(getAuthInfo)
                .then(authInfo => {
                    const port = chrome.runtime.connect(msg.extension);
                    port.postMessage({
                        action: "login",
                        token: authInfo.bearerToken,
                        api_base_url: authInfo.apiBaseUrl,
                    })
                })
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    backgroundLog(`[message] ${JSON.stringify(message)}`)

    // Remember that all of these need to do ASYNC work (including logging)

    if (message.action === "submit") {
        auth(message.value).catch((error) => {
            backgroundLog(`[error] ${error}`)
        })
    } else if (message.action === "set_api_base_url") {
        return chrome.storage.local.set({
            "ffiii_api_base_url": message.value,
        });
    } else if (message.action === "set_client_id") {
        return chrome.storage.local.set({
            "ffiii_client_id": message.value,
        });
    } else if (message.action === "get_connections") {
        getRegisteredConnections().then(sendResponse);
    } else if (message.action === "get_auth") {
        chrome.storage.local.get({
            ffiii_api_base_url: "",
            ffiii_client_id: "",
        })
            .then(data => sendResponse({
                apiBaseUrl: data.ffiii_api_base_url,
                clientId: data.ffiii_client_id,
            }))
            .then(sendResponse);
    } else if (message.action === "check_logged_in") {
        getAuthInfo()
            .then(token => sendResponse(!!token?.bearerToken))
            .catch(err => {
                console.log(err);
                sendResponse(false);
            })
    } else {
        backgroundLog(`[UNRECOGNIZED ACTION] ${message.action}`);
        return false;
    }
    return true
});
