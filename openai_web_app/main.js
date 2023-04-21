let book = SpreadsheetApp.openById('1sbRQczrjQGhsa1Td22w1zK6oq8OwyeU6esaqO_It0oo');
let sheet = book.getSheetByName('config');
const OPENAI_API_KEY      = sheet.getRange("B1").getValue();

/**
 * initialize form
 */
function doGet(e) {
  Logger.log(e);
  let html = HtmlService.createTemplateFromFile('index');  
  html.question = "";

  const all_logs = chatAllLog();
  const disp_log = all_logs.disp_log;

  html.history = disp_log;
  html.answer = "AI answer coming up here";
  return html.evaluate();
}

/**
 * send question to ai
 */
function doPost(e) {
  Logger.log(e);

  const all_logs = chatAllLog();
  const chat_seq = all_logs.chat_seq;
  const disp_log = all_logs.disp_log;

  // load question
  const question = e.parameter.question;

  // reset histories
  if (question == "reset") {
    const email = Session.getActiveUser().getEmail();
    let my_sheet = SpreadsheetApp.openById('1sbRQczrjQGhsa1Td22w1zK6oq8OwyeU6esaqO_It0oo').getSheetByName(email);
    book.deleteSheet(my_sheet);
    let html = HtmlService.createTemplateFromFile('index');  
    html.question = "";
    const all_logs = chatAllLog();
    const disp_log = all_logs.disp_log;
    html.history = disp_log;
    html.answer = "チャット履歴を削除しました";
    return html.evaluate();
  }

  chat_seq.push({"role": "user", "content": question});

  var params = {
    'model': "gpt-3.5-turbo",
//    'model': "gpt-4",
    'messages': chat_seq,
  };
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + OPENAI_API_KEY,
  };
  var data = JSON.stringify(params);
  var options = {
     "method" : "post",
     "payload" : data,
     "headers" : headers,
  };
  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
  console.log(response.toString())
  let json = JSON.parse(response);
  const answer = json.choices[0].message.content;

  // record ai chat log
  makeInsert(question, "user");
  makeInsert(answer, "assistant");

  let html = HtmlService.createTemplateFromFile('index');  
  html.question = question;
  html.answer = answer;
  html.history = disp_log;
  return html.evaluate();
}

/**
 * get script url
 */
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * save chat log
 */
function makeInsert(chat, role) {
  const email = Session.getActiveUser().getEmail();
  let my_sheet = SpreadsheetApp.openById('1sbRQczrjQGhsa1Td22w1zK6oq8OwyeU6esaqO_It0oo').getSheetByName(email);
  if (!my_sheet) {
    my_sheet = book.insertSheet();
    my_sheet.setName(email);
  }
  let row = [chat, role];
  my_sheet.appendRow(row);
}

/**
 * get all chat logs
 */
function chatAllLog() {
  const email = Session.getActiveUser().getEmail();
  let my_sheet = SpreadsheetApp.openById('1sbRQczrjQGhsa1Td22w1zK6oq8OwyeU6esaqO_It0oo').getSheetByName(email);
  var chat_seq = [];
  let disp_log = "<table class=\"table table-striped table-bordered table-sm\"><tr><th>Sender</th><th>Message</th></tr>";
  if (!my_sheet) {
    return {"chat_seq":chat_seq, "disp_log":disp_log}
  }

  const range = my_sheet.getDataRange();
  const values = range.getValues();
  Logger.log(values);
  for (value of values) {
      chat_seq.push({"role": value[1], "content": value[0]});
      disp_log =　disp_log + "<tr><td>" +  value[1] + "</td><td>" + value[0] + "</td></tr>"
  }

  return {"chat_seq":chat_seq, "disp_log":disp_log}
}




