url = "https://root.amfoss.in/"

function getMemberQuery(year) {
    return {
        query: `
        {
            members(year: ${year}) {
                memberId
                rollNo
            }
        }
        `
    };
}

function getAtttendanceQuery(naiveDate) {
    return {
        query: `
        {
            attendanceByDate(date: ${naiveDate}) {
                memberId
                date
                timeIn
                timeOut
                name
            }
        }
        `
    };
}

function getMemberFromRoot() {
    let finalData = [];

    for (let year = 0; year < 5; year++) {
        const response = UrlFetchApp.fetch(url, {
            method: "POST",
            contentType: "application/json",
            payload: JSON.stringify(getMemberQuery(year)),
            muteHttpExceptions: true
        });

        const data = JSON.parse(response.getContentText())['data']['members'];
        finalData = finalData.concat(data);
    }

    return finalData;
}

function getAttendanceFromRoot(naiveDate) {
    const memberData = getMemberFromRoot();
    
    let finalData = [];

    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(getAtttendanceQuery(naiveDate)),
      muteHttpExceptions: true
    });

    let attendanceData = JSON.parse(response.getContentText())['data']['attendanceByDate'];

    for (const attendance of attendanceData) {
        let temp_data = {};

        temp_data['name'] = attendance['name'];
        temp_data['timeIn'] = attendance['timeIn'];
        temp_data['timeOut'] = attendance['timeOut'];

        for (const member of memberData) {
            if (member['memberId'] == attendance['memberId']) {
                temp_data['rollNo'] = member['rollNo'];
                break;
            }
        }

        finalData.push(temp_data);
    }
    
    return finalData;
}

function fillSheet(sheet,memberDatas) {
    sheet.clearContents();

    sheet.appendRow(['Sl No','Name','Roll No','Seat No','Time In', 'Time Out']);
    
    sheet.setColumnWidth(1, 50);
    sheet.setColumnWidth(2, 210);
    sheet.setColumnWidth(3, 160);
    sheet.setColumnWidth(4, 80);
    sheet.setColumnWidth(5, 80);
    sheet.setColumnWidth(6, 80);
    
    sheet.getRange(1, 1, 1, 6).setBackground('#FFFF00').setFontWeight("bold"); 

    let sl_count = 1;
    memberDatas.forEach(record => {
        if (record.timein != "00:00:00") {
          sheet.appendRow([sl_count,record['name'],record['rollNo'],"",record['timeIn'], record['timeOut']]);
          sl_count++;
        }
      });
}

function main() {
  try {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    let date = `${day}/${month}/${year}`;
    let naiveDate = `"${year}-${month}-${day}"`;

    const memberDataMap = getAttendanceFromRoot(naiveDate);
    let filteredData = [];
    let any_presence_flag = false;

    for (const member of memberDataMap) {
        if (member['timeIn'] !== null) {
            filteredData.push(member);
            any_presence_flag = true;
        }
    }

    if (any_presence_flag) {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

      const sheetName = `${date}`
      
      if (spreadsheet.getSheetByName(sheetName) != null) {
        const sheet = spreadsheet.getSheetByName(sheetName);
        fillSheet(sheet,filteredData);
      } else {
        const sheet = spreadsheet.insertSheet(sheetName);
        fillSheet(sheet,filteredData);
      }

    } else {
      console.log('No attendance data found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}