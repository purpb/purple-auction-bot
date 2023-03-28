import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

// Farcaster API
export const appBearerToken = process.env.APP_BEARER_TOKEN
export const farcasterApi = process.env.APP_FARCASTER_API

// Seconds to wait between checking for auction settlement
export const pollingInterval = process.env.APP_POLLING_INTERVAL ? parseInt(process.env.APP_POLLING_INTERVAL) : 60 * 60 * 1

// Used in Farcaster cast message
export const discordUrl = process.env.APP_DISCORD
export const charmverseUrl = process.env.APP_CHARMVERSE
export const websiteUrl = process.env.APP_WEBSITE

export const purpleAddress = process.env.APP_PURPLE_ADDRESS

export const alchemyApiKey = process.env.APP_ALCHEMY_API_KEY