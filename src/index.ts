import { sleep } from 'sleep'
import { getEvents } from './getEvents'
import { GET_AUCTION_SETTLED_EVENTS } from './queries/auctionsQueries'
import { networkInfoApi, farcasterApi, pollingInterval, discordUrl, charmverseUrl, websiteUrl } from './config'
import { safeGET, safePOST } from './utils/https'

const main = async () => {

  const initNetworkInfo = await safeGET(networkInfoApi)
  if(!initNetworkInfo) {
    console.error(`Cannot start app`)
    return 
  }
  var lastSeenBlockHeight = initNetworkInfo.data.height

  while(true) {
    const networkInfo = await safeGET(networkInfoApi)
    if(!initNetworkInfo) {
      sleep(pollingInterval)
      continue 
    }
    const currentBlockHeight = networkInfo.data.height
    console.log(`lastSeenBlockHeight: ${lastSeenBlockHeight}, currentBlockHeight: ${currentBlockHeight}`)

    if(currentBlockHeight > lastSeenBlockHeight) {
      const auctionEvents = await getEvents(
        lastSeenBlockHeight,
        currentBlockHeight,
        GET_AUCTION_SETTLED_EVENTS
      );
      lastSeenBlockHeight = currentBlockHeight

      console.log(`Found ${auctionEvents.length} AUCTION_SETTLED events`)

      var foundEvents = false
      for(let event of auctionEvents) {
        foundEvents = true
        console.log(`Address ${event.properties.properties.winner} wins token ${event.properties.properties.tokenId}`)

        const winner = event.properties.properties.winner
        const winnerVerifications = await safeGET(`${farcasterApi}/user-by-verification?address=${winner}`, true)
        if(!winnerVerifications) { 
          continue 
        }
        let winnerUsername: string = winnerVerifications.data.result.user.username

        const castPayload = {
            text: `${winnerUsername}, Welcome to @purple! 🟪 Here are some links to get you started! \n\nDiscord: ${discordUrl} \nCharmverse: ${charmverseUrl} \nWebsite: ${websiteUrl}`
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