/**
 * シートオープンのオーバーライド
 */
function onOpen() {
  const customMenu = SpreadsheetApp.getUi();
  customMenu.createMenu('シート転記').addItem('実行', 'execConvert').addToUi();
}

/**
 * 変換実行する
 */
function execConvert() {
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('名簿');
  const range = sheet.getDataRange();
  const values = range.getValues();

  Logger.log(values);

  let orginal_values = convertToKeyValueData(values);

  Logger.log(orginal_values);

  const converted_values = [];
  let i = 0;

  // ヘッダ構築
  const converted_value = {};
  converted_value['name'] = 'name';
  converted_value['place'] = 'place';
  converted_value['tel'] = 'tel';
  converted_value['del_flg'] = 'del_flg';

  let append_obj = [];
  append_obj = Object.values(converted_value);
  Logger.log(append_obj);
  converted_values[i] = append_obj;
  i++;

  for(const orginal_value of orginal_values){
    Logger.log(orginal_value);
  
    // マッピング開始
    const converted_value = {};
    converted_value['name'] = orginal_value['名前'];
    converted_value['place'] = orginal_value['住所'];
    converted_value['tel'] = orginal_value['電話番号'];
    converted_value['del_flg'] = '0';
    Logger.log(converted_value);

    let append_obj = [];
    append_obj = Object.values(converted_value);
    Logger.log(append_obj);
    converted_values[i] = append_obj;
    i++;
  }

  Logger.log(converted_values);

  // 常に新しいシートに出力する
  const sheet_new = ss.insertSheet();
  sheet_new.setName(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss'));
  sheet_new.getRange(1, 1, converted_values.length, converted_values[0].length).setValues(converted_values);
}

/**
 * キーバリュー形式のデータに変換する
 */
function convertToKeyValueData(values){
  const headers = values.shift();
  let objects = [];
  for(const [index, value] of values.entries()){
    if(!objects[index]){
      objects[index] = {};
    }
    for(const [i, header] of headers.entries()){
      objects[index][header] = value[i];
    }
  }
  return objects;
}
