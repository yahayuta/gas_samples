let sheet = SpreadsheetApp.openById('1sbRQczrjQGhsa1Td22w1zK6oq8OwyeU6esaqO_It0oo').getSheetByName('config');
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
  var projectId = 'yahayuta';
  queryResults = BigQuery.Jobs.query({
    useLegacySql: false,
    query: makeInsert(question, "user")
  }, projectId);
  console.log(queryResults);
  queryResults = BigQuery.Jobs.query({
    useLegacySql: false,
    query: makeInsert(answer, "assistant")
  }, projectId);
  console.log(queryResults);

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
  return `INSERT INTO app.openai_chat_log (user_id,chat,role,created) VALUES ('${email}','${chat}','${role}',CURRENT_DATETIME)`;
}

/**
 * get all chat logs
 */
function chatAllLog() {
  const email = Session.getActiveUser().getEmail();
  var projectId = 'yahayuta';
  var query = `SELECT role, chat FROM app.openai_chat_log WHERE user_id = '${email}' order by created`;
  var request = {
    query: query,
    useLegacySql: false
  };

  var queryResults = BigQuery.Jobs.query(request, projectId);
  var jobId = queryResults.jobReference.jobId;

  // Wait for query to complete
  while (!queryResults.jobComplete) {
    Utilities.sleep(1000);
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
  }

  // Get results
  var rows = queryResults.rows;
  var chat_seq = [];
  let disp_log = "<table class=\"table table-striped table-bordered table-sm\"><tr><th>Sender</th><th>Message</th></tr>";

  if (rows) {
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      chat_seq.push({"role": row.f[0].v, "content": row.f[1].v});
      disp_log =　disp_log + "<tr><td>" +  row.f[0].v + "</td><td>" + row.f[1].v + "</td></tr>"
    }
  }

  disp_log = disp_log　+ "</table>";
  return {"chat_seq":chat_seq, "disp_log":disp_log}
}

