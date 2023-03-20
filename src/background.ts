import {createURLSearchParams, generateCodeChallenge, generateCodeVerifier} from './utils'
import {Connection} from "./common/connection";
import MessageSender = chrome.runtime.MessageSender;

const weeklyExportNotificationID = "firefly-iii-chrome-extension-hub-weekly-export-notification"

chrome.notifications.onButtonClicked.addListener((id) => {
    if (id !== weeklyExportNotificationID) {
        return;
    }
    chrome.runtime.openOptionsPage();
})

async function notifyIfDueForWeeklyRun(): Promise<void> {
    const data = await chrome.storage.local.get("firefly_iii_last_run")
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
}

async function reAuthIfExpired(): Promise<boolean> {
    const data = await chrome.storage.local.get({
        ffiii_bearer_created_milliseconds: "",
        ffiii_bearer_lifetime_seconds: "",
    });
    let created = data.ffiii_bearer_created_milliseconds;
    if (!created) {
        console.log("Never authed before");
        return false;
    }
    let lifetime = data.ffiii_bearer_lifetime_seconds;
    const expiresAtDateSeconds = (created / 1000) + lifetime;
    const threeDaysSeconds = 3 * 24 * 60 * 60;
    const refreshAtDateSeconds = expiresAtDateSeconds - threeDaysSeconds;
    let refreshAtDateMillis = refreshAtDateSeconds * 1000;
    const refreshAtDate = new Date(refreshAtDateMillis);
    refreshAtDate.setHours(0, 0, 0, 0);
    refreshAtDateMillis = refreshAtDate.getTime();
    console.log(`Will refresh after ${refreshAtDate}`);
    console.log(`Token expires after ${new Date(expiresAtDateSeconds * 1000)}`);
    if (new Date().getTime() < refreshAtDateMillis) {
        console.log('Too early for refresh')
        return true;
    }
    console.log('Refreshing now!')
    await reauth();
    return true;
}

chrome.runtime.onStartup.addListener(async () => {
    const authed = await reAuthIfExpired();
    if (authed) {
        await notifyIfDueForWeeklyRun();
    }
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

        publicClientTokenRequest(
            params.tokenEndpoint,
            body,
        ).then(v => {
            chrome.runtime.sendMessage({
                action: "result",
                value: JSON.stringify(v),
            }).then(() => {
                chrome.storage.local.set({
                    "ffiii_bearer_token": v.access_token,
                    "ffiii_refresh_token": v.refresh_token,
                    "ffiii_bearer_created_milliseconds": new Date().getTime(),
                    "ffiii_bearer_lifetime_seconds": v.expires_in,
                    "ffiii_api_base_url": params.apiBaseURL,
                }, () => {
                })
            }).catch(e => {
                backgroundLog(`[error] got malformed json response: ${JSON.stringify(v)}, error: ${e}`)
            })
        });
        return true;
    });
}

async function reauth(): Promise<void> {
    const data = await chrome.storage.local.get({
        ffiii_api_base_url: "",
        ffiii_client_id: "",
        ffiii_refresh_token: "",
    });

    console.log('stored data', data);

    const tokenEndpoint = `${data.ffiii_api_base_url}/oauth/token`

    const body = createURLSearchParams({
        grant_type: 'refresh_token',
        client_id: data.ffiii_client_id,
        refresh_token: data.ffiii_refresh_token,
    })

    const response = await publicClientTokenRequest(
        tokenEndpoint,
        body,
    );

    console.log('refresh response', response);

    return chrome.storage.local.set({
        "ffiii_bearer_token": response.access_token,
        "ffiii_refresh_token": response.refresh_token,
        "ffiii_bearer_created_milliseconds": new Date().getTime(),
        "ffiii_bearer_lifetime_seconds": response.expires_in,
    }, () => {
    });
}

interface AuthInfo {
    bearerToken: string;
    apiBaseUrl: string;
}

export function getAuthInfo(): Promise<AuthInfo> {
    return chrome.storage.local.get(["ffiii_bearer_token", "ffiii_api_base_url"]).then(r => {
        if (!r.ffiii_bearer_token) {
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

async function getRegisteredConnections(): Promise<Connection[]> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("firefly_iii_hub_connections", (val) => {
            const curVal = JSON.parse(val.firefly_iii_hub_connections || "[]");
            resolve(curVal);
        });
    });
}

async function registerConnection(extension: Connection): Promise<Connection> {
    return getRegisteredConnections().then(
        conns => {
            const cs: { [key: string]: Connection } = {};
            conns.forEach(c => cs[c.id] = c)
            extension.name = extension.name || `Untitled [ID:${extension.id}]`
            extension.lastAutoRunDurationSeconds = extension.lastAutoRunDurationSeconds || cs[extension.id]?.lastAutoRunDurationSeconds,
                cs[extension.id] = extension;
            chrome.storage.local.set({
                "firefly_iii_hub_connections": JSON.stringify(Object.values(cs)),
            })
            return extension;
        }
    )
}

chrome.runtime.onMessageExternal.addListener(function (msg: any, sender: MessageSender, sendResponse: Function) {
    console.log('message', msg);
    if (msg.action === "register") {
        if (msg.extension !== sender.id) {
            console.error("Mismatched extension ID. Possible spoof detected.")
            return;
        }
        registerConnection({
            id: msg.extension,
            name: msg.name,
            primaryColor: msg.primary_color_hex,
            secondaryColor: msg.secondary_color_hex,
            isRegistered: false,
        }).then(() => sendResponse());
    } else if (msg.action === "auto_run_duration_seconds") {
        getRegisteredConnections().then(cs => {
            const connection = cs.find(c => c.id === sender.id);
            if (!connection) {
                console.error("Received auto run update from non-registered extension", msg);
                return;
            }
            connection.lastAutoRunDurationSeconds = Number.parseInt(msg.seconds);
            return registerConnection(connection)
        }).then(() => sendResponse())
    } else {
        sendResponse();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    backgroundLog(`[message] ${JSON.stringify(message)}`)

    if (message.action === "submit") {
        auth(message.value).catch((error) => {
            backgroundLog(`[error] ${error}`)
        }).then(() => sendResponse());
    } else if (message.action === "refresh_auth") {
        reauth()
            .then(getAuthInfo)
            .then(authInfo => getRegisteredConnections()
                .then(conns => conns.filter(c => c.isRegistered))
                .then(conns => conns.forEach(c => chrome.runtime.sendMessage(c.id, {
                    action: "login",
                    token: authInfo.bearerToken,
                    api_base_url: authInfo.apiBaseUrl,
                })))
            )
            .then(() => sendResponse());
    } else if (message.action === "set_api_base_url") {
        return chrome.storage.local.set({
            "ffiii_api_base_url": message.value,
        }).then(() => sendResponse());
    } else if (message.action === "set_client_id") {
        return chrome.storage.local.set({
            "ffiii_client_id": message.value,
        }).then(() => sendResponse());
    } else if (message.action === "get_connections") {
        getRegisteredConnections().then(conns => sendResponse(conns));
    } else if (message.action === "grant_registration") {
        getRegisteredConnections().then(cons => {
            const connection = cons.find(v => v.id === message.extension_id);
            if (!connection) {
                throw new Error("Connection was not found in list");
            }
            return {...connection, isRegistered: true}
        })
            .then(c => registerConnection(c))
            .then(c => getAuthInfo()
                .then(ai => chrome.runtime.sendMessage(c.id, {
                    action: "login",
                    token: ai.bearerToken,
                    api_base_url: ai.apiBaseUrl,
                }))
            )
            .then(() => sendResponse(true))
            .catch(err => {
                console.error(err);
                sendResponse(false);
            });
    } else if (message.action === "get_auth") {
        chrome.storage.local.get({
            ffiii_api_base_url: "",
            ffiii_client_id: "",
        })
            .then(data => sendResponse({
                apiBaseUrl: data.ffiii_api_base_url,
                clientId: data.ffiii_client_id,
            }))
            .then(() => sendResponse());
    } else if (message.action === "check_logged_in") {
        getAuthInfo()
            .then(token => sendResponse(!!token?.bearerToken))
            .catch(err => {
                console.log(err);
                sendResponse(false);
            })
    } else {
        backgroundLog(`[UNRECOGNIZED ACTION] ${message.action}`);
        sendResponse();
        return false;
    }
    return true
});
