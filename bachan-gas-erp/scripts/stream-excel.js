const ExcelJS = require('exceljs');
const path = 'C:/Users/Asus/Downloads/23.xlsx';

async function streamInspect() {
  console.log('Stream-reading:', path);
  const start = Date.now();
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(path, {
    entries: 'emit',
    sharedStrings: 'cache',
    worksheets: 'emit'
  });

  let sheetCount = 0;
  for await (const entry of reader) {
    if (entry.type === 'worksheet') {
      sheetCount++;
      console.log(`\n=== Sheet ${sheetCount}: ${entry.name || 'Sheet'} ===`);
      let rowNum = 0;
      let header = null;
      let rowsSample = [];
      for await (const row of entry) {
        rowNum++;
        if (rowNum === 1) {
          header = row.values;
          console.log('Header Row 1:', JSON.stringify(header));
        } else if (rowNum <= 5) {
          rowsSample.push({ row: rowNum, values: row.values });
        }
        if (rowNum % 10000 === 0) {
          console.log(`Read ${rowNum} rows in ${((Date.now() - start)/1000).toFixed(1)}s...`);
        }
      }
      console.log(`Total Rows in sheet: ${rowNum}`);
      console.log('Sample rows:', JSON.stringify(rowsSample, null, 2));
    }
  }
  console.log(`\nCompleted stream analysis in ${((Date.now() - start)/1000).toFixed(2)}s`);
}

streamInspect().catch(console.error);

