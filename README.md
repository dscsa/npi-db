# NPI Database

## General

Built to maintain a Google Sheet that pulls from the NPPES NPI Registry: https://npiregistry.cms.hhs.gov

Uses version 2.0 of the DB API https://npiregistry.cms.hhs.gov/registry/help-api

Because API doesn't allow searching by state, performs a series of API calls through each zip code in Georgia, collecting results.

Maintains a 'Live' sheet that can be pulled from elsewhere. With weekly updates in a staging area, user can specifiy which changes to push through to Live.
