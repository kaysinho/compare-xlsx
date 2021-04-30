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
  readonly EXCELTYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  readonly NEW = 'new';
  readonly OLD = 'old';
  readonly NEWSHEET = 'new_sheet';
  readonly REMOVEDSHEET = 'removed_sheet';
  readonly EDITEDSHEET = 'edited_sheet';
  columPositions: Array<number> = [];
  readonly columns: Array<string> = [
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
  newWorkBook = new Excel.Workbook();
  removedWorkBook = new Excel.Workbook();
  editedWorkBook = new Excel.Workbook();
  workSheet: any;
  constructor() {}
  readExcel(status: any, event: any): void {
    const target: DataTransfer = event.target as DataTransfer;
    if (target.files.length !== 1) {
      return;
    }
    const arryBuffer = new Response(target.files[0]).arrayBuffer();
    arryBuffer.then((data: any) => {
      this.workbook.xlsx.load(data).then(() => {
        data = this.workbook.getWorksheet(1).getSheetValues();
        this.workbook.addWorksheet('sheet2');
        this.workSheet = this.workbook.getWorksheet(2);
        try {
          this.workbook
            .getWorksheet(1)
            .eachRow({ includeEmpty: true }, (row: any, rowNumber: any) => {
              if (row.values.includes(this.columns[4])) {
                data = data.slice(rowNumber, data.length);
                throw new Error(); // we no longer need to iterate
              }
            });
        } catch (error) {}
        if (status === this.NEW) {
          this.newFile = data;
          this.readingNewFile = false;
        } else {
          this.previousFile = data;
          this.readingPreviousFile = false;
        }
        this.workbook.removeWorksheet(1);
      });
    });
  }
  createTable(tableType: string, rows: Excel.RowArray): void {
    const filteredRows = rows;
    // tslint:disable-next-line: max-line-length
    filteredRows.filter((row: any) => {
      return row.shift();
    }); // ! low performance: remove empty values from rows. A workaround: https://github.com/exceljs/exceljs/issues/100
    switch (tableType) {
      case this.NEWSHEET:
        const newWorkSheet = this.newWorkBook.getWorksheet(1);
        if (newWorkSheet) {
          newWorkSheet.addTable(this.defaultTableDataSet(filteredRows));
        } else {
          this.newWorkBook
            .addWorksheet(this.NEWSHEET)
            .addTable(this.defaultTableDataSet(filteredRows));
        }
        break;
      case this.EDITEDSHEET:
        const editedWorkSheet = this.editedWorkBook.getWorksheet(1);
        if (editedWorkSheet) {
          editedWorkSheet.addTable(this.defaultTableDataSet(filteredRows));
        } else {
          this.editedWorkBook
            .addWorksheet(this.EDITEDSHEET)
            .addTable(this.defaultTableDataSet(filteredRows));
        }
        break;
      case this.REMOVEDSHEET:
        const removedWorkSheet = this.removedWorkBook.getWorksheet(1);
        if (removedWorkSheet) {
          removedWorkSheet.addTable(this.defaultTableDataSet(filteredRows));
        } else {
          this.removedWorkBook
            .addWorksheet(this.REMOVEDSHEET)
            .addTable(this.defaultTableDataSet(filteredRows));
        }
        break;
    }
  }
  defaultTableDataSet(rows: any): Excel.TableProperties {
    return {
      name: 'Table',
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
      rows: [...rows],
    };
  }
  download(tableType: string): void {
    switch (tableType) {
      case this.NEWSHEET:
        this.newWorkBook.xlsx.writeBuffer().then((data: any) => {
          const blob = new Blob([data], {
            type: this.EXCELTYPE,
          });
          fileSaver.saveAs(blob, 'new-records.xlsx');
        });
        break;
      case this.EDITEDSHEET:
        this.editedWorkBook.xlsx.writeBuffer().then((data: any) => {
          const blob = new Blob([data], {
            type: this.EXCELTYPE,
          });
          fileSaver.saveAs(blob, 'edited-records.xlsx');
        });
        break;
      case this.REMOVEDSHEET:
        this.removedWorkBook.xlsx.writeBuffer().then((data: any) => {
          const blob = new Blob([data], {
            type: this.EXCELTYPE,
          });
          fileSaver.saveAs(blob, 'deleted-records.xlsx');
        });
        break;
    }
  }
  async compare(): Promise<void> {
    if (typeof Worker !== 'undefined') {
      const worker = new Worker('./excel.worker', { type: 'module' });
      worker.onmessage = (response) => {
        const {
          data: { newRecords, editedRecords, deletedRecords, finished },
        } = response;
        if (newRecords) {
          this.newRecords = newRecords;
          this.createTable(this.NEWSHEET, this.newRecords);
          this.writingNewFiles = true;
        }
        if (deletedRecords) {
          this.deletedRecords = deletedRecords;
          this.createTable(this.REMOVEDSHEET, this.deletedRecords);
          this.writingDeletedFiles = true;
          this.writingNewFiles = false;
        }
        if (editedRecords) {
          this.editedRecords = editedRecords;
          this.createTable(this.EDITEDSHEET, this.editedRecords);
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
  reset(): void {
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
