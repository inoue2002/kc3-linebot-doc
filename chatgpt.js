const ACCESS_TOKEN = 'xxxxxxxx';
// OpenAIのAPIキーを取得
const API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxx';

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
    const message = await chatGptRequest(event.message.text);
    return [{ type: 'text', text: message }];
  } catch (e) {
    console.log(e);
    return [{ type: 'text', text: 'エラーが発生しました。' }];
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

async function chatGptRequest(message) {
  // OpenAIのエンドポイント
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  // System パラメータ
  const systemPrompt = 'AIアシスタントとして振る舞ってください。常にポジティブな回答を心がけましょう。';
  // 送信メッセージを定義
  let messages = [{ role: 'system', content: systemPrompt }];
  messages.push({ role: 'user', content: message });

  // パラメータ設定
  const requestBody = {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2048,
    messages: messages,
  };
  // 送信内容を設定
  const request = {
    method: 'POST',
    muteHttpExceptions: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + API_KEY,
    },
    payload: JSON.stringify(requestBody),
  };

  try {
    //OpenAIのChatGPTにAPIリクエストを送り、結果を変数に格納
    const response = JSON.parse(UrlFetchApp.fetch(apiUrl, request).getContentText());
    // ChatGPTのAPIレスポンスをセルに記載
    if (response.choices) {
      return response.choices[0].message.content;
    } else {
      // レスポンスが正常に返ってこなかった場合の処理
      console.log(response);
      throw new Error('error');
    }
  } catch (e) {
    // 例外エラー処理
    console.log(e);
    responseCell.setValue(e);
  }
}

async function test_chatGpt() {
  const res = await chatGptRequest('こんにちは！好きな魚を一つ選んでください');
  console.log(res);
}
