import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readingNewFile: boolean = false;
  readingPreviousFile: boolean = false;
  writing: boolean = false;
  readonly NEW = 'new';
  readonly OLD = 'old';
  readonly startAt = 'A1';
  newFile: any = [];
  previousFile: any = [];
  updateEveryMS = 1000;
  newRecords: Array<any> = [];
  deletedRecords: Array<any> = [];
  editedRecords: Array<any> = [];
  constructor() {}
  onFileChange(status: string, ev: any) {
    status === this.NEW
      ? (this.readingNewFile = true)
      : (this.readingPreviousFile = true);
    let workBook: any = null;
    let jsonData = null;
    const reader = new FileReader();
    const file = ev.target.files[0];
    reader.onload = (event) => {
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      const nameSheet = workBook.SheetNames[0]
      const ref = workBook.Sheets[nameSheet]['!ref'];
      const endAt = ref.split(':')[1];
      const range = `${this.startAt}:${endAt}`;
      jsonData = workBook.SheetNames.reduce((initial: any, name: any) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet, { range });
        return initial;
      }, {});
      if (status === this.NEW) {
        this.newFile = jsonData;
        this.readingNewFile = false;
      } else {
        this.previousFile = jsonData;
        this.readingPreviousFile = false;
      }
    };
    reader.readAsBinaryString(file);
  }

  async compare() {
    if (typeof Worker !== 'undefined') {
      this.writing = true;
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
