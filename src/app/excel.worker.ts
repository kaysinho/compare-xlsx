/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  console.log('sdaad');
  const newFile = data.newFile;
  const oldFile = data.oldFile;
  let newRecords = [];
  let deletedRecords = [];
  let editedRecords = [];
  const equals = (a: any, b: any): boolean =>
    JSON.stringify(a) === JSON.stringify(b);
  //new
  for (let current of newFile) {
    if (!oldFile.some((row: any) => row.GUI === current.GUI)) {
      newRecords.push(current);
    }
  }
  console.log('news ', newRecords);
  postMessage({ newRecords });

  // deleted
  for (let old of oldFile) {
    if (!newFile.some((row: any) => row.GUI === old.GUI)) {
      deletedRecords.push(old);
    }
  }
  console.log('deleted ', deletedRecords);
  postMessage({ deletedRecords });

  //updated
  for (let old of oldFile) {
    for (let current of newFile) {
      if (old.GUI === current.GUI) {
        if (!equals(old, current)) {
          editedRecords.push(current);
        }
      }
    }
  }
  console.log('edited ', editedRecords);
  postMessage({ editedRecords });
});
