const ACCESS_TOKEN = 'token';
async function doPost(e) {
  for (let i = 0; i < JSON.parse(e.postData.contents).events.length; i++) {
    const event = JSON.parse(e.postData.contents).events[i];
    const message = await eventHandle(event);
    //応答するメッセージがあった場合
    if (message !== undefined) {
      const replyToken = event.replyToken;
      const replyUrl = 'https://api.line.me/v2/bot/message/reply';
      UrlFetchApp.fetch(replyUrl, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Authorization: 'Bearer ' + ACCESS_TOKEN,
        },
        method: 'post',
        payload: JSON.stringify({
          replyToken: replyToken,
          messages: message,
        }),
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ content: 'post ok' })).setMimeType(
    ContentService.MimeType.JSON
  );
}

async function eventHandle(event) {
  let message;
  switch (event.type) {
    case 'message':
      message = await messagefunc(event);
      break;
    case 'postback':
      message = await postbackFunc(event);
      break;
    case 'follow':
      message = await followFunc(event);
      break;
    case 'unfollow':
      message = unfolowFunc(event);
      break;
  }
  return message;
}
//メッセージイベントの処理
async function messagefunc(event) {
  try {
    const userProfile = await getProfile(event.source.userId);
    const userId = userProfile.userId;
    const userName = userProfile.displayName;
    const userImageUrl = userProfile.pictureUrl;
    return [{ type: 'text', text: `こんにちは！${userName}さん！\nあなたのユーザーIDは${userProfile.userId}` }, {
      "type": "image",
      "originalContentUrl": userImageUrl,
      "previewImageUrl": userImageUrl
    }];
  } catch (e) {
    console.log(e);
    return [{ type: 'text', text: 'エラーが発生しました。' + e }];
  }
}
//ポストバックイベントの処理
async function postbackFunc(event) {
  return [{ type: 'text', text: event.postback.data }];
}
//友達登録時の処理
async function followFunc(event) {
  return [{ type: 'text', text: '友達登録ありがとうございます!!' }];
}
//友達解除後の処理
async function unfollowFunc() {
  return undefined;
}

async function getProfile(userId) {
  const options = {
    "method": "get",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + ACCESS_TOKEN
    }
  };
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const response = JSON.parse(UrlFetchApp.fetch(url, options))
  /**
   * {"userId":"Ue2072b8ca9d29c61506f25b8b9aff4b0","displayName":"Yosuke Inoue","pictureUrl":"https://sprofile.line-scdn.net/0hFdXwlhAXGUt1Dgx0x4FnNAVeGiFWf0BZXWkBJRIITy9BOA0dXGhWfxQGR3kdPVcVXWhfLxUGFHl5HW4ta1jlf3I-R3xPPlocX2pRqQ","statusMessage":"軸","language":"ja"}
   */
  return response;
}

