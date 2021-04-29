import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import * as Excel from 'exceljs';
import * as fileSaver from 'file-saver';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  myWorkbook = new Excel.Workbook();
  readingNewFile = false;
  readingPreviousFile = false;
  writingNewFiles = false;
  writingEditedFiles = false;
  writingDeletedFiles = false;
  readonly NEW = 'new';
  readonly OLD = 'old';
  readonly startAt = 'A1';
  columPositions: Array<number> = [];
  readonly colums: Array<string> = [
    'Region',
    'Country',
    'WLC',
    'Location',
    'GUI',
    'UPN',
    'Last Name',
    'First Name',
    'Service Line',
    'Organization',
    'SMU Name',
    'Title',
    'Rank',
    'Work Phone',
    'EA Name',
    'EA Phone',
  ];
  newFile: any = [];
  previousFile: any = [];
  updateEveryMS = 1000;
  newRecords: Array<any> = [];
  deletedRecords: Array<any> = [];
  editedRecords: Array<any> = [];
  sheetName = '';
  workbook = new Excel.Workbook();
  constructor() {}
  readExcel(event: any) {
    const target: DataTransfer = event.target as DataTransfer;
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }

    /**
     * Final Solution For Importing the Excel FILE
     */

    const arryBuffer = new Response(target.files[0]).arrayBuffer();
    arryBuffer.then((data) => {
      this.workbook.xlsx.load(data).then(() => {
        // play with workbook and worksheet now
        console.log(this.workbook);
        const worksheet = this.workbook.getWorksheet(1);
        const work2 = this.workbook.addWorksheet('sheet2');
        console.log(worksheet.getTable('Table1'));
        this.workbook.removeWorksheet(1);
        work2.addTable({
          name: 'MyTable',
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: {
            theme: 'TableStyleLight2',
            showRowStripes: true,
          },
          columns: [
            { name: 'Region', filterButton: true },
            { name: 'Country', filterButton: true },
            { name: 'WLC', filterButton: true },
            { name: 'Location', filterButton: true },
            { name: 'GUI', filterButton: true },
            { name: 'UPN', filterButton: true },
            { name: 'Last Name', filterButton: true },
            { name: 'First Name', filterButton: true },
            { name: 'Service Line', filterButton: true },
            { name: 'Organization', filterButton: true },
            { name: 'SMU Name', filterButton: true },
            { name: 'Title', filterButton: true },
            { name: 'Rank', filterButton: true },
            { name: 'Work Phone', filterButton: true },
            { name: 'EA Name', filterButton: true },
            { name: 'EA Phone', filterButton: true },
          ],
          rows: [
            [new Date('2019-07-20'), 70.1],
            [new Date('2019-07-21'), 70.6],
            [new Date('2019-07-22'), 70.1],
          ],
        });
        worksheet.eachRow((row, rowNumber) => {});
      });
    });
  }
  generate() {
    this.workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fileSaver.saveAs(blob, 'CarData.xlsx');
    });
  }
  onFileChange(status: string, ev: any) {
    if (status === this.NEW) {
      this.readingNewFile = true;
    } else {
      this.readingPreviousFile = true;
    }

    let data = [];
    const reader = new FileReader();
    const file = ev.target.files[0];

    reader.onload = (e: any) => {
      console.log('Se carga el archivo');
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      this.sheetName = wsname;
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      console.log('Archivo leido');
      data = this.normalizeData(data);

      console.log('Archivo procesado');
      if (status === this.NEW) {
        this.newFile = data;
        this.readingNewFile = false;
      } else {
        this.previousFile = data;
        this.readingPreviousFile = false;
      }
      console.log(data);
    };
    reader.readAsBinaryString(file);
  }

  normalizeData(data: any) {
    const newData: Array<any> = [];

    /** Delete first rows */
    let i = 0;
    let rowsFound = false;
    while (!rowsFound) {
      if (data[i].length > 12) {
        rowsFound = true;
      } else {
        i++;
      }
    }
    data = data.slice(i, data.length);
    /** End delete first rows */

    // It's for know the mandatory column positions
    this.firstRow(data[0]);

    // We create a new array only with the mandatory columns
    const percentage = 0;
    for (let i = 0; i < data.length; i++) {
      const row = this.normalizeRow(data[i]);
      /*percentage = (((i+1) * 100) / data.length)
      this.readingPercentagePreviousFile = percentage;
      this.readingPercentageNewFile = percentage;
      console.log(percentage)*/
      if (row.length > 0) {
        newData.push(row);
      }
    }

    return newData;
  }

  firstRow(row: Array<any>) {
    this.columPositions = [];

    for (let i = 0; i < row.length; i++) {
      if (this.colums.includes(row[i])) {
        this.columPositions.push(i);
      }
    }
  }

  normalizeRow(row: Array<any>): Array<any> {
    const newRow: Array<any> = [];
    for (let i = 0; i < row.length; i++) {
      if (this.columPositions.includes(i)) {
        newRow.push(row[i]);
      }
    }
    return newRow;
  }

  async compare() {
    if (typeof Worker !== 'undefined') {
      const worker = new Worker('./excel.worker', { type: 'module' });
      worker.onmessage = (response) => {
        const {
          data: { newRecords, editedRecords, deletedRecords, finished },
        } = response;
        if (newRecords) {
          this.newRecords = newRecords;
          this.writingNewFiles = true;
        }

        if (deletedRecords) {
          this.deletedRecords = deletedRecords;
          this.writingDeletedFiles = true;
          this.writingNewFiles = false;
        }

        if (editedRecords) {
          this.editedRecords = editedRecords;
          this.writingDeletedFiles = false;
          this.writingEditedFiles = true;
        }

        if (finished) {
          this.writingEditedFiles = false;
        }
      };
      worker.postMessage({
        newFile: this.newFile,
        oldFile: this.previousFile,
      });
    } else {
      console.log('couldnt run');
    }
  }
  equals = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

  download(type: string) {
    let fileName = '';
    let file: Array<any> = [];
    switch (type) {
      case 'new':
        fileName = 'new-records.xlsx';
        file = this.newRecords;
        break;
      case 'deleted':
        fileName = 'deleted-records.xlsx';
        file = this.deletedRecords;
        break;
      case 'updated':
        fileName = 'updated-records.xlsx';
        file = this.editedRecords;
        break;
    }

    file.unshift(this.colums);
    console.log(file);
    /* table id is passed over here */
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(file);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.sheetName);

    /* save to file */
    XLSX.writeFile(wb, fileName);
  }
  reset() {
    this.newRecords = [];
    this.deletedRecords = [];
    this.editedRecords = [];
    this.previousFile = [];
    this.newFile = [];

    this.readingNewFile = false;
    this.readingPreviousFile = false;
    this.writingNewFiles = false;
    this.writingEditedFiles = false;
    this.writingDeletedFiles = false;
  }
}
