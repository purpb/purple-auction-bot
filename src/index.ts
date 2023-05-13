import { sleep } from 'sleep'
import { getEvents } from './getEvents'
import { GET_AUCTION_SETTLED_EVENTS } from './queries/auctionsQueries'
import { farcasterApi, pollingInterval, discordUrl, charmverseUrl, websiteUrl, purpleAddress, alchemyApiKey } from './config'
import { safeGET, safePOST } from './utils/https'
import { Network, Alchemy } from 'alchemy-sdk'

function pad2(n: number) { return n < 10 ? '0' + n : n }

const main = async () => {

  const settings = {
    apiKey: alchemyApiKey,
    network: Network.ETH_MAINNET
  }
  const alchemy = new Alchemy(settings)
  
  const startingBlock = await alchemy.core.getBlockNumber()
  if(!startingBlock) {
    console.error(`Cannot start app. Terminating.`)
    return 
  }
  var lastSeenBlockHeight = startingBlock

  while(true) {
    let currentBlockHeight
    try {
      currentBlockHeight = await alchemy.core.getBlockNumber()
    } catch(err) {
      console.error(err)
      sleep(pollingInterval)
      continue
    }

    if(!currentBlockHeight) {
      console.error(`Error getting currentBlockHeight: ${currentBlockHeight}. Trying again later.`)
      sleep(pollingInterval)
      continue 
    }

    const date = new Date();
    const dateString = `${date.getFullYear().toString()}-${pad2(date.getMonth() + 1)}-${pad2( date.getDate())} ${pad2( date.getHours() )}:${pad2( date.getMinutes() )}.${pad2( date.getSeconds() )}`

    console.log(`${dateString}: lastSeenBlockHeight: ${lastSeenBlockHeight}, currentBlockHeight: ${currentBlockHeight}`)

    if(currentBlockHeight > lastSeenBlockHeight) {
      const auctionEvents = await getEvents(
        lastSeenBlockHeight,
        currentBlockHeight,
        GET_AUCTION_SETTLED_EVENTS
      );

      if(auctionEvents == undefined) {
        console.error(`Error getting actionEvents: ${auctionEvents}. Trying again later.`)
        sleep(pollingInterval)
        continue
      }
      lastSeenBlockHeight = currentBlockHeight

      console.log(`Found ${auctionEvents.length} AUCTION_SETTLED events`)

      var foundEvents = false
      for(let event of auctionEvents) {
        foundEvents = true
        console.log(`Address ${event.properties.properties.winner} wins token ${event.properties.properties.tokenId}!`)

        const winner = event.properties.properties.winner
        const winnerVerifications = await safeGET(`${farcasterApi}/user-by-verification?address=${winner}`, true)
        if(!winnerVerifications) {
          console.warn(`Could not find Farcaster user for ${winner}. Skipping.`)
          continue 
        }
        let winnerUsername: string = winnerVerifications.data.result.user.username
        if(!winnerUsername) {
          console.error(`Erroring fetching Farcaster username in verifications object for ${winner}. Skipping.`)
          continue 
        }

        const nftsOwned = await alchemy.nft.getNftsForOwner(winner, { contractAddresses: [purpleAddress!] })

        let castPayload = {
          text: `@${winnerUsername}, Welcome to @purple! 🟪 Here are some links to get you started!\n\nDiscord: ${discordUrl} \nCharmverse: ${charmverseUrl} \nWebsite: ${websiteUrl}`
        }
        if(nftsOwned.totalCount > 1) {
          castPayload.text = `@${winnerUsername}, Congratulations on winning another @purple! 🟪 You now have a total of ${nftsOwned.totalCount}!\n\nDiscord: ${discordUrl} \nCharmverse: ${charmverseUrl} \nWebsite: ${websiteUrl}`
        }

        console.log(castPayload)
        await safePOST(`${farcasterApi}/casts`, castPayload, true)
      }

      if(foundEvents) {
        lastSeenBlockHeight++ // move the block cursor to after the last event
      }
    }
    sleep(pollingInterval)
  }
}

main()