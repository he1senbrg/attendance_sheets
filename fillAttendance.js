url = "https://root.amfoss.in/"

function getAttendanceQuery(naiveDate) {
    return {
        query: `
        {
            allMembers {
                attendance {
                    onDate(date: ${naiveDate}) {
                        date
                        timeIn
                        timeOut
                    }
                }
                name
                memberId
                rollNo
            }
        }
        `
    };
}

function getAttendanceFromRoot(naiveDate) {
    const response = UrlFetchApp.fetch(url, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(getAttendanceQuery(naiveDate)),
        muteHttpExceptions: true
    });

    let membersData = JSON.parse(response.getContentText())['data']['allMembers'];
    let finalData = [];

    for (const member of membersData) {
        let temp_data = {};

        temp_data['name'] = member['name'];
        temp_data['rollNo'] = member['rollNo'];
        temp_data['memberId'] = member['memberId'];
        
        const attendanceOnDate = member['attendance']['onDate'];
        if (attendanceOnDate) {
            temp_data['timeIn'] = attendanceOnDate['timeIn'];
            temp_data['timeOut'] = attendanceOnDate['timeOut'];
            temp_data['date'] = attendanceOnDate['date'];
        } else {
            temp_data['timeIn'] = null;
            temp_data['timeOut'] = null;
            temp_data['date'] = null;
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
        if (record.timeIn != null && record.timeIn != "00:00:00") {
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
