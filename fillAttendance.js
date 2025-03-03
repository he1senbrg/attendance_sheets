url = "https://root.amfoss.in/"

function getMemberQuery(year) {
    return {
        query: `
        {
            members(year: ${year}) {
                memberId
                name
                rollNo
                macAddress
            }
        }
        `
    };
}

function getAtttendanceQuery(memberId) {
    return {
        query: `
        {
            attendance(memberId: ${memberId}) {
                memberId
                date
                timeIn
                timeOut
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

function getAttendanceFromRoot() {
    const memberData = getMemberFromRoot();
    let finalData = [];

    for (let i = 0; i < memberData.length; i++) {
        let temp_data = {};

        const response = UrlFetchApp.fetch(url, {
            method: "POST",
            contentType: "application/json",
            payload: JSON.stringify(getAtttendanceQuery(memberData[i]['memberId'])),
            muteHttpExceptions: true
        });

        let data = JSON.parse(response.getContentText())['data']['attendance'];
        if (data.length > 0) {
            data = data[data.length - 1];
        }

        temp_data['name'] = memberData[i]['name'];
        temp_data['rollNo'] = memberData[i]['rollNo'];
        temp_data['timeIn'] = data['timeIn'];
        temp_data['timeOut'] = data['timeOut'];

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
    const memberDataMap = getAttendanceFromRoot();
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

      let date = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

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