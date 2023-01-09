# Firefly III Chrome Extension Base

## Status
This project is still in early development, so it may require a higher level of 
skill to utilize.

## Purpose

This is a "template" for building chrome extensions that can scrape account and 
transaction data from banking websites and automatically push the data into an
instance of Firefly III.

This project exists as an alternative to the cloud-based banking APIs (E.g. 
plaid) in order to maximize privacy by keeping your banking data out of the 
hands of third parties.

## Motivation
Here's the thing: 

Banks don't really want you to pull your data into external services like 
Firefly III, etc. They'd rather sell you products to manage your finances 
(often for free) and keep all of your data in their walled gardens. This helps 
them keep you away from competitors. It's smart business.

With that in mind, providing a good, convenient way of exporting data (or, god 
forbid, an API) is extremely rare from banks.

So, scraping data from websites via a Chrome Extension is an alternative.

## Capabilities
- Includes a menu for logging in to Firefly III with Oauth 2
- Provides code examples for interacting with the Firefly III API

## Building your own extension
Fork this repo and use it as a base for your extension. Implement the content 
scripts in the [`src/content_scripts`](src/content_scripts) directory to scrape 
your bank's pages.

## Future Plans
Ideally, this project would use dependency injection, so you can provide your
own "page scraping" service to satisfy a dependency interface, minimizing the
amount of overlap between your code and the base code.

## Credit
- The OAuth2 component of this project was based on this project by satetsu888
  - https://github.com/satetsu888/simple-oauth2-client-extension
  - [Buy them a coffee](https://www.buymeacoffee.com/satetsu888)