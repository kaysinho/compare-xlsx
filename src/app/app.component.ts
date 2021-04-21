import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly NEW = 'new';
  readonly OLD = 'old';
  newFile: any = [];
  previousFile: any = [];
  updateEveryMS = 1000;
  newRecords: Array<any> = [];
  deletedRecords: Array<any> = [];
  editedRecords: Array<any> = [];
  test: any;
  constructor() {}

  onFileChange(status: string, ev: any) {
    let workBook: any = null;
    let jsonData = null;
    const reader = new FileReader();
    const file = ev.target.files[0];
    reader.onload = (event) => {
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = workBook.SheetNames.reduce((initial: any, name: any) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet);
        return initial;
      }, {});
      const dataString = JSON.stringify(jsonData);
      status === this.NEW
        ? (this.newFile = jsonData)
        : (this.previousFile = jsonData);
      this.test = jsonData;
    };
    reader.readAsBinaryString(file);
  }

  async compare() {
    if (typeof Worker !== 'undefined') {
      const worker = new Worker('./excel.worker', { type: 'module' });
      worker.onmessage = (response) => {
        const {
          data: { newRecords, editedRecords, deletedRecords },
        } = response;
        if (newRecords) {
          this.newRecords = newRecords;
        }
        if (editedRecords) {
          this.editedRecords = editedRecords;
        }
        if (deletedRecords) {
          this.deletedRecords = deletedRecords;
        }
      };
      worker.postMessage({
        newFile: this.newFile.Sheet1,
        oldFile: this.previousFile.Sheet1,
      });
    } else {
      console.log('couldnt run');
    }
  }
  equals = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

  download(type: string) {
    let fileName: string = '';
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

    /* table id is passed over here */
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(file);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, fileName);
  }
  reset() {
    this.newRecords = [];
    this.deletedRecords = [];
    this.editedRecords = [];
    this.previousFile = [];
    this.newFile = [];
  }
}
