import {AccountStore} from "firefly-iii-typescript-sdk-fetch/dist/models";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL.

function scrapeAccountsFromPage(): AccountStore[] {
    // TODO: This is where you implement the scraper to pull the individual
    //  accounts from the page
    return [];
}

window.addEventListener("load",function(event) {
    const button = document.createElement("button");
    button.textContent = "Export Accounts"
    button.addEventListener("click", () => {
        const accounts = scrapeAccountsFromPage();
        chrome.runtime.sendMessage(
            {
                action: "store_accounts",
                value: accounts,
            },
            () => {}
        );
    }, false);

    // TODO: This is where you add a "scrape" button to the page where all the
    //  bank accounts are listed.
    document.body.append(button);
});
