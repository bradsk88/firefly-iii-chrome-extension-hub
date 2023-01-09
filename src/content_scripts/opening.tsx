import {OpeningBalance} from "../background";

// TODO: You will need to update manifest.json so this file will be loaded on
//  the correct URL.

function scrapeOpeningBalanceFromPage(): OpeningBalance {
    // TODO: This is where you implement the scraper to pull the opening
    //  balance from the page
    return {} as never as OpeningBalance;
}

window.addEventListener("load",function(event) {
    const button = document.createElement("button");
    button.textContent = "Export Opening Balance"
    button.addEventListener("click", () => {
        const openingBalance = scrapeOpeningBalanceFromPage();
        chrome.runtime.sendMessage(
            {
                action: "store_opening",
                value: openingBalance,
            },
            () => {}
        );
    }, false);

    // TODO: This is where you add a "scrape" button to the page where all the
    //  bank accounts are listed.
    document.body.append(button);
});
