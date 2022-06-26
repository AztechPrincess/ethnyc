import { BigInt, Bytes, ipfs, json, JSONValue, TypedMap } from '@graphprotocol/graph-ts'
import {
  ProfileCreated,
  PostCreated,
  MirrorCreated,
  CommentCreated,
  Followed,
  DefaultProfileSet,
} from '../../generated/LensHub/LensHub'
import { accounts, profiles, publicactions, follows, stats } from '../modules'
import { sendEPNSNotification } from '../EPNSNotification';
const getMetadata = (uri: string): Bytes => {
  let result = ipfs.cat(uri.replace("https://ipfs.infura.io/ipfs/", ""));
  let counter = 0;
  while (!result || counter < 5) {
    result = ipfs.cat(uri.replace("https://ipfs.infura.io/ipfs/", ""));
    counter++;
  }
  return result as Bytes;
};

const getMetadataValue = (
  metadataObj: TypedMap<string, JSONValue>,
  key: string
): string | null =>
  metadataObj.get(key) ? (metadataObj.get(key) as JSONValue).toString() : null;


export function handleProfileCreated(event: ProfileCreated): void {
  let profile = profiles.getOrCreateProfile(event.params.profileId, event.params.timestamp)
  let creator = accounts.getOrCreateAccount(event.params.creator)
  let to = accounts.getOrCreateAccount(event.params.to)
  to.profilesIds = accounts.getListProfileOwned(to, event.params.profileId)

  profile.creator = event.params.creator.toHexString()
  profile.owner = event.params.to.toHexString()
  profile.followNFTURI = event.params.followNFTURI
  profile.followModule = event.params.followModule
  profile.handle = event.params.handle
  profile.followModuleReturnData = event.params.followModuleReturnData
  profile.imageURI = event.params.imageURI
  profile.lastUpdated = event.block.timestamp

  creator.save()
  to.save()
  profile.save()
}

export function handlePostCreated(event: PostCreated): void {
  let post = publicactions.getOrCreatePost(event.params.profileId, event.params.pubId)
  post.fromProfile = event.params.profileId.toString()
  post.pubId = event.params.pubId
  post.referenceModule = event.params.referenceModule
  post.referenceModuleReturnData = event.params.referenceModuleReturnData
  post.timestamp = event.params.timestamp
  post.contentURI = event.params.contentURI

  post.collectModule = event.params.collectModule
  post.collectModuleReturnData = event.params.collectModuleReturnData

  let result = getMetadata(event.params.contentURI);
  if(!!result) {
    const metadata = json.fromBytes(result);
    const metadataObj = metadata.toObject();
    post.name = getMetadataValue(metadataObj, "name");
    post.description = getMetadataValue(metadataObj, "description");
    post.content = getMetadataValue(metadataObj, "content");
  }
  
  let stat = stats.getOrCreateLensInfo()
  stat.lastPostCreatedAt = event.params.timestamp
  stat.save()

  post.save()
}

export function handleMirrorCreated(event: MirrorCreated): void {
  let mirror = publicactions.getOrCreateMirror(event.params.profileId, event.params.pubId)
  mirror.fromProfile = event.params.profileId.toString()
  mirror.pubId = event.params.pubId
  mirror.referenceModule = event.params.referenceModule
  mirror.referenceModuleReturnData = event.params.referenceModuleReturnData
  mirror.timestamp = event.params.timestamp
  mirror.profileIdPointed = event.params.profileIdPointed
  mirror.pubIdPointed = event.params.pubIdPointed
  let recipient = "0x1db67d560813ea7aba48bd8a9429cbecbeb2118e";
  let type = "3";
  let title = "PUSH Received";
  let body = `Received PUSH from 0x1db67d560813ea7aba48bd8a9429cbecbeb2118e`;
  let subject = "PUSH Received";
  let message = `Received 0x1db67d560813ea7aba48bd8a9429cbecbeb2118e`;
  let image = "https://play-lh.googleusercontent.com/i911_wMmFilaAAOTLvlQJZMXoxBF34BMSzRmascHezvurtslYUgOHamxgEnMXTklsF-S";
  let secret = "null";
  let cta = "https://epns.io/";
  let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\"}`
  sendEPNSNotification(recipient, notification);
  let stat = stats.getOrCreateLensInfo()
  stat.lastMirrorCreatedAt = event.params.timestamp
  stat.save()

  mirror.save()
}

export function handleCommentCreated(event: CommentCreated): void {
  let comment = publicactions.getOrCreateComment(event.params.profileId, event.params.pubId)
  comment.fromProfile = event.params.profileId.toString()
  comment.pubId = event.params.pubId
  comment.referenceModule = event.params.referenceModule
  comment.referenceModuleReturnData = event.params.referenceModuleReturnData
  comment.timestamp = event.params.timestamp
  comment.contentURI = event.params.contentURI
  comment.profileIdPointed = event.params.profileIdPointed
  comment.pubIdPointed = event.params.pubIdPointed
  comment.collectModule = event.params.collectModule
  comment.collectModuleReturnData = event.params.collectModuleReturnData
  let recipient = "0x1db67d560813ea7aba48bd8a9429cbecbeb2118e";
  let type = "3";
  let title = "PUSH Received";
  let body = `Received PUSH from 0x1db67d560813ea7aba48bd8a9429cbecbeb2118e`;
  let subject = "PUSH Received";
  let message = `Received 0x1db67d560813ea7aba48bd8a9429cbecbeb2118e`;
  let image = "https://play-lh.googleusercontent.com/i911_wMmFilaAAOTLvlQJZMXoxBF34BMSzRmascHezvurtslYUgOHamxgEnMXTklsF-S";
  let secret = "null";
  let cta = "https://epns.io/";
  let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\"}`
  sendEPNSNotification(recipient, notification);

  let stat = stats.getOrCreateLensInfo()
  stat.lastCommentCreatedAt = event.params.timestamp
  stat.save()

  comment.save()
}

export function handleFollowed(event: Followed): void {
  let newFollows: string[] = []
  newFollows = event.params.profileIds.map<string>((profileId: BigInt): string => profileId.toString())

  let follow = follows.getOrCreateFollow(
    event.params.follower
      .toHexString()
      .concat('-')
      .concat(event.transaction.hash.toHex()),
  )

  follow.fromAccount = event.params.follower.toHexString()
  follow.fromProfileSTR = event.params.follower.toHexString()
  follow.toProfile = newFollows
  follow.timestamp = event.params.timestamp
  let recipient = "0x1db67d560813ea7aba48bd8a9429cbecbeb2118e";
  let type = "3";
  let title = "PUSH Received";
  let body = `Received PUSH from 0x1db67d560813ea7aba48bd8a9429cbecbeb2118e`;
  let subject = "PUSH Received";
  let message = `Received 0x1db67d560813ea7aba48bd8a9429cbecbeb2118e`;
  let image = "https://play-lh.googleusercontent.com/i911_wMmFilaAAOTLvlQJZMXoxBF34BMSzRmascHezvurtslYUgOHamxgEnMXTklsF-S";
  let secret = "null";
  let cta = "https://epns.io/";
  let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\"}`
  sendEPNSNotification(recipient, notification);
  follow.save()
}

export function handleDefaultProfileSet(event: DefaultProfileSet): void {
  let account = accounts.getOrCreateAccount(event.params.wallet)
  account.defaultProfile = event.params.profileId.toString()
  account.save()
}