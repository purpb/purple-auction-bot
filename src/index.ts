import { sleep } from 'sleep'
import { getEvents } from './getEvents'
import { GET_AUCTION_SETTLED_EVENTS } from './queries/auctionsQueries'
import { networkInfoApi, farcasterApi, pollingInterval, discordUrl, charmverseUrl, websiteUrl } from './config'
import { safeGET, safePOST } from './utils/https'


function pad2(n: number) { return n < 10 ? '0' + n : n }

const main = async () => {

  const initNetworkInfo = await safeGET(networkInfoApi)
  if(!initNetworkInfo) {
    console.error(`Cannot start app. Terminating.`)
    return 
  }
  var lastSeenBlockHeight = initNetworkInfo.data.height

  while(true) {
    const networkInfo = await safeGET(networkInfoApi)
    if(!networkInfo) {
      console.error(`Error getting networkInfo: ${networkInfo}. Trying again later.`)
      sleep(pollingInterval)
      continue 
    }

    const date = new Date();
    const dateString = `${date.getFullYear().toString()}-${pad2(date.getMonth() + 1)}-${pad2( date.getDate())} ${pad2( date.getHours() )}:${pad2( date.getMinutes() )}.${pad2( date.getSeconds() )}`

    const currentBlockHeight = networkInfo.data.height
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

        const castPayload = {
            text: `@${winnerUsername}, Welcome to @purple! 🟪 Here are some links to get you started! \n\nDiscord: ${discordUrl} \nCharmverse: ${charmverseUrl} \nWebsite: ${websiteUrl}`
        }
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