import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  newFile: Array<any> = [];
  previousFile: Array<any> = [];

  newRecords: Array<any> = [];
  deletedRecords: Array<any> = [];
  editedRecords: Array<any> = [];

  constructor() {

  }


  onNewFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);

    if (target.files.length !== 1) throw new Error("Cannot use multiple files");

    const reader: FileReader = new FileReader()

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname]
      this.newFile = (XLSX.utils.sheet_to_json(ws, { header: 1 }))
    }

    reader.readAsBinaryString(target.files[0])
  }

  onPreviousFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);

    if (target.files.length !== 1) throw new Error("Cannot use multiple files");

    const reader: FileReader = new FileReader()

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname]
      this.previousFile = (XLSX.utils.sheet_to_json(ws, { header: 1 }))
    }

    reader.readAsBinaryString(target.files[0])
  }

  reset() {
    this.newRecords = []
    this.deletedRecords = []
    this.editedRecords = []
    this.previousFile = []
    this.newFile = []
  }

  compare() {

    //new
    for (let current of this.newFile) {
      if (!this.previousFile.some(p => p[4] === current[4])) {
        this.newRecords.push(current)
      }
    }
    console.log('news ', this.newRecords)

    //deleted
    for (let old of this.previousFile) {
      if (!this.newFile.some(l => l[4] === old[4])) {
        this.deletedRecords.push(old)
      }
    }
    console.log('deleted ', this.deletedRecords)

    //updated
    for (let old of this.previousFile) {
      for (let current of this.newFile) {
        if (old[4] === current[4]) {
          if (!this.equals(old, current)) {
            this.editedRecords.push(current)
          }
        }
      }
    }
    console.log('edited ', this.editedRecords)


  }

  equals = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

  download(type: string) {

    let fileName: string = '';
    let file: Array<any> = [];
    switch (type) {
      case 'news':
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


}
