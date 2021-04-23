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
  startAt = 'A1';
  readingNewFile: boolean = false;
  readingPreviousFile: boolean = false;
  writing: boolean = false;
  newFile: any = [];
  previousFile: any = [];
  updateEveryMS = 1000;
  newRecords: Array<any> = [];
  deletedRecords: Array<any> = [];
  editedRecords: Array<any> = [];
  sheetName: string = '';
  customArray = [
    'GUI',
    'Region',
    'Country',
    'WLC',
    'Location',
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
      this.sheetName = workBook.SheetNames[0];
      const ref = workBook.Sheets[this.sheetName]['!ref'];
      const endAt = ref.split(':')[1];
      const range = `${this.startAt}:${endAt}`;
      jsonData = workBook.SheetNames.reduce((initial: any, name: any) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet, { range });
        return this.filterByCustomColumns(initial[name]);
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
        newFile: this.newFile,
        oldFile: this.previousFile,
      });
    } else {
      console.log('couldnt run');
    }
  }
  equals = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);
  filterByCustomColumns = (sheet: any) =>
    sheet.map((jsonData: any) =>
      Object.keys(jsonData)
        .filter((key) => this.customArray.includes(key))
        .reduce((custom: any, key) => {
          custom[key] = jsonData[key];
          return custom;
        }, {})
    );
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
    this.writing = false;
  }
}
