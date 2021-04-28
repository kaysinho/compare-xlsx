/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const newFile = data.newFile;
  const oldFile = data.oldFile;
  let newRecords = [];
  let deletedRecords = [];
  let editedRecords = [];
  let finished : boolean = true;
  const equals = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

  //new
  for (let current of newFile) {
    if (!oldFile.some((row: any) => row[4] === current[4])) {
      newRecords.push(current);
      postMessage({ newRecords });
    }
  }
  postMessage({ newRecords });

  // deleted
  for (let old of oldFile) {
    if (!newFile.some((row: any) => row[4] === old[4])) {
      deletedRecords.push(old);
      postMessage({ deletedRecords });
    }
  }
  postMessage({ deletedRecords });

  //updated
  for (let old of oldFile) {
    for (let current of newFile) {
      if (old[4] === current[4]) {
        if (!equals(old, current)) {
          editedRecords.push(current);
          postMessage({ editedRecords });
        }
      }
    }
  }
  postMessage({ editedRecords });

  postMessage({finished})
});
