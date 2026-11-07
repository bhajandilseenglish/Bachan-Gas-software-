const ExcelJS = require('exceljs');
const path = 'C:/Users/Asus/Downloads/23.xlsx';

async function inspect() {
  const wb = new ExcelJS.Workbook();
  console.log('Loading workbook: ' + path);
  const start = Date.now();
  await wb.xlsx.readFile(path);
  console.log('Loaded in ' + ((Date.now() - start)/1000).toFixed(2) + 's');
  console.log('Worksheets count: ' + wb.worksheets.length);
  
  wb.worksheets.forEach((ws, i) => {
    console.log('\n--- Sheet ' + (i+1) + ': ' + ws.name + ' ---');
    console.log('Total Rows: ' + ws.rowCount + ', Columns: ' + ws.columnCount);
    
    const r1 = ws.getRow(1).values;
    console.log('Headers (Row 1):', JSON.stringify(r1));
    
    for (let r = 2; r <= Math.min(5, ws.rowCount); r++) {
      console.log('Row ' + r + ':', JSON.stringify(ws.getRow(r).values));
    }
  });
}

inspect().catch(err => {
  console.error('Error reading excel:', err);
});

