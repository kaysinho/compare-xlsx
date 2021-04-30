/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const newFile = data.newFile;
  const oldFile = data.oldFile;
  const newRecords = [];
  const deletedRecords = [];
  const editedRecords = [];
  const finished = true;
  const equals = (a: any, b: any): boolean =>
    JSON.stringify(a) === JSON.stringify(b);

  // new
  console.log(newFile);
  for (const current of newFile) {
    if (current && !oldFile.some((row: any) => row[5] === current[5])) {
      newRecords.push(current);
      postMessage({ newRecords });
    }
  }
  postMessage({ newRecords });

  // deleted
  for (const old of oldFile) {
    if (old && !newFile.some((row: any) => row[5] === old[5])) {
      deletedRecords.push(old);
      postMessage({ deletedRecords });
    }
  }
  postMessage({ deletedRecords });

  // updated
  for (const old of oldFile) {
    for (const current of newFile) {
      if (old && current && old[5] === current[5]) {
        if (!equals(old, current)) {
          editedRecords.push(current);
          postMessage({ editedRecords });
        }
      }
    }
  }
  postMessage({ editedRecords });

  postMessage({ finished });
});
