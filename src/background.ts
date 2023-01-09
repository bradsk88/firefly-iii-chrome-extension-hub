import {createURLSearchParams, generateCodeChallenge, generateCodeVerifier} from './utils'
import {AccountsApi, Configuration, TransactionsApi, TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {AccountArray, AccountStore} from "firefly-iii-typescript-sdk-fetch/dist/models";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";

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
            "ffiii": {
                "bearer_token": response.access_token
            }
        }, () => {
        });
    });
}

export function getBearerToken(): Promise<string> {
    return chrome.storage.local.get(["ffiii"]).then(r => {
        return r.ffiii.bearer_token;
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

async function storeAccounts(data: AccountStore[]) {
    getBearerToken().then(token => {
        // TODO: Initialize once
        let api = new AccountsApi(
            new Configuration({
                basePath: "http://192.168.0.124:4575",
                accessToken: `Bearer ${token}`,
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/vnd.api+json",
                },
                fetchApi: self.fetch.bind(self),
            }),
        );
        // api.listAccount({}).then((r: any) => backgroundLog(JSON.stringify(r)));
        data.forEach(accountStore => api.storeAccount({accountStore: accountStore}));
    })
}

async function storeTransactions(
    data: TransactionStore[],
) {
    getBearerToken().then(token => {
        // TODO: Initialize once
        let api = new TransactionsApi(
            new Configuration({
                basePath: "http://192.168.0.124:4575",
                accessToken: `Bearer ${token}`,
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/vnd.api+json",
                },
                fetchApi: self.fetch.bind(self),
            }),
        );
        data.forEach(txStore => api.storeTransaction({
            transactionStore: txStore,
        }));
    })
}

export interface OpeningBalance {
    accountNumber: string;
    accountName: string;
    balance: number;
    date: Date;
}

async function storeOpeningBalance(
    data: OpeningBalance,
) {
    getBearerToken().then(token => {
        // TODO: Initialize once
        let api = new AccountsApi(
            new Configuration({
                basePath: "http://192.168.0.124:4575",
                accessToken: `Bearer ${token}`,
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/vnd.api+json",
                },
                fetchApi: self.fetch.bind(self),
            }),
        );
        api.updateAccount({
            id: data.accountNumber,
            accountUpdate: {
                name: data.accountName,
                openingBalance: `${data.balance}`,
                openingBalanceDate: data.date,
            }
        })
    })
}


export async function listAccounts(): Promise<AccountRead[]> {
    return getBearerToken().then(token => doListAccounts(token));
}

async function doListAccounts(
    token: string,
): Promise<AccountRead[]> {
    let api = new AccountsApi(
        new Configuration({
            basePath: "http://192.168.0.124:4575",
            accessToken: `Bearer ${token}`,
            headers: {
                "Content-Type": "application/json",
                "accept": "application/vnd.api+json",
            },
            fetchApi: self.fetch.bind(self),
        }),
    );
    return api.listAccount({
        // TODO: handle lots of accounts (multiple pages)
    }).then(
        (arr: AccountArray) => arr.data,
    );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    backgroundLog(`[message] ${JSON.stringify(message)}`)

    // Remember that all of these need to do ASYNC work (including logging)

    if (message.action === "submit") {
        auth(message.value).catch((error) => {
            backgroundLog(`[error] ${error}`)
        })
    } else if (message.action === "store_accounts") {
        patchDatesAccount(message.value).then(
            accs => storeAccounts(accs),
        ).catch((error) => {
            backgroundLog(`[error] ${error}`)
        });
    } else if (message.action === "store_transactions") {
        patchDatesAndAvoidDupes(message.value).then(
            txStore => storeTransactions(txStore),
        ).catch((error) => {
            backgroundLog(`[error] ${error}`)
        });

    } else if (message.action === "store_opening") {
        patchDatesOB(message.value).then(
            obStore => storeOpeningBalance(obStore),
        ).catch((error) => {
            backgroundLog(`[error] ${error}`)
        });

    } else if (message.action === "list_accounts") {
        listAccounts().then(accounts => sendResponse(accounts));
        return true;
    } else {
        backgroundLog(`[UNRECOGNIZED ACTION] ${message.action}`);
        return false;
    }
    return true
});

async function patchDatesAndAvoidDupes(data: TransactionStore[]): Promise<TransactionStore[]> {
    return data.map(ts => {
        ts.errorIfDuplicateHash = ts.errorIfDuplicateHash === undefined ? true : ts.errorIfDuplicateHash;
        ts.transactions = ts.transactions.map(v => {
            v.date = new Date(v.date); // Dates are converted to strings for message
            return v;
        })
        return ts;
    });
}

async function patchDatesOB(data: OpeningBalance): Promise<OpeningBalance> {
    data.date = new Date(data.date);
    return data;
}

async function patchDatesAccount(data: AccountStore[]): Promise<AccountStore[]> {
    return data.map(acc => {
        const d = acc.monthlyPaymentDate;
        acc.monthlyPaymentDate = d ? new Date(d) : d;
        const od = acc.openingBalanceDate;
        acc.openingBalanceDate = od? new Date(od) : od;
        return acc;
    });
}