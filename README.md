# Firefly III Chrome Extension Hub

## Status
This project is in an "alpha" state. It works well for me, but your mileage may
vary.

## Purpose
This is a Chrome extension that acts as a "hub" for other chrome extensions that
are based on the [Chrome Extension base project](
https://github.com/bradsk88/firefly-iii-chrome-extension-base).

## Motivation
I expect a typical user of this "Firefly III Chrome Extension ecosystem" will 
probably have more than one bank that they want to scrape. Having to log in to
each extension and manually run the scrapes on a regular basis is tedious.

## Capabilities
- Includes a guided walkthrough for easily logging in to Firefly III with OAuth2
- Can begin an "auto run" process that opens the bank for each installed 
  extension and directs each extension to begin scraping new accounts and 
  transactions automatically and then close the bank tab.
- Shares its OAuth2 token with the other installed extensions so they can push
  data into Firefly III.
- Automates the process of granting runtime permissions to the other installed
  extensions to minimize the required permissions for Chrome Web Store submission.

## Building this extension
```bash
npm install
npm run build
```

## Future Plans
- Better user interface
- Better integration with password managers for auto-login, if possible
- Surface data metrics to users (e.g. # new transactions, duration of autorun)

## Credit
- The OAuth2 component of this project was based on this project by satetsu888
  - https://github.com/satetsu888/simple-oauth2-client-extension
  - [Buy them a coffee](https://www.buymeacoffee.com/satetsu888)
