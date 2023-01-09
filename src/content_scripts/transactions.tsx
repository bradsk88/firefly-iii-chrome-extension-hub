import {TransactionStore} from "firefly-iii-typescript-sdk-fetch";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {addButtonOnURLMatch} from "../common/buttons";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL.


export interface PageAccount {
    id: string;
    name: string;
}

/**
 * @param accounts The first page of account in your Firefly III instance
 */
async function getCurrentPageAccount(
    accounts: AccountRead[],
): Promise<PageAccount> {
    // TODO: Find either the account number or account name on the page.
    const accountNumber = "<implement this>";
    // Use that to find the Firefly III account ID from the provided list.
    let acct = accounts.find(
        acct => acct.attributes.accountNumber === accountNumber,
    )!;
    return {
        id: acct.id,
        name: acct.attributes.name,
    };
}

/**
 * @param pageAccountId The Firefly III account ID for the current page
 */
function scrapeTransactionsFromPage(
    pageAccountId: string,
): TransactionStore[] {
    // TODO: This is where you implement the scraper to pull the individual
    //  transactions from the page
    return [];
}

const buttonId = 'firefly-iii-export-transactions-button';

function addButton() {
    // TODO: This is where you add a "scrape" button to the page where the
    //  account's transactions are listed.
    const button = document.createElement("button");
    button.textContent = "Export Transactions"
    button.addEventListener("click", async () => {
        const accounts = await chrome.runtime.sendMessage({
            action: "list_accounts",
        });
        const id = await getCurrentPageAccount(accounts);
        const transactions = scrapeTransactionsFromPage(id.id);
        chrome.runtime.sendMessage(
            {
                action: "store_transactions",
                value: transactions,
            },
            () => {
            }
        );
    }, false);


    document.body.append(button);
}

// If your manifest.json allows your content script to run on multiple pages,
// you can call this function more than once, or set the urlPath to "".
addButtonOnURLMatch(
    'accounts/main/details',
    () => !!document.getElementById(buttonId),
    () => addButton(),
)
