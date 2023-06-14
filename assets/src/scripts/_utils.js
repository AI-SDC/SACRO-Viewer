/* eslint-disable import/prefer-default-export */
export const getFileExt = (str) => str.split(`.`).pop();

export function csvStringToTable(csvString, el) {
  const rows = csvString.trim().split(/\r?\n|\r/); // Regex to split/separate the CSV rows
  let table = ``;
  let tableRows = ``;
  let tableHeader = ``;

  rows.forEach((row, rowIndex) => {
    let tableColumns = ``;
    const columns = row.split(`,`); // split/separate the columns in a row
    columns.forEach((column) => {
      tableColumns +=
        rowIndex === 0 ? `<th>${column}</th>` : `<td>${column}</td>`;
    });
    if (rowIndex === 0) {
      tableHeader += `<tr>${tableColumns}</tr>`;
    } else {
      tableRows += `<tr>${tableColumns}</tr>`;
    }
  });

  table += `<table class="min-w-full divide-y divide-gray-300 text-left">`;
  table += `<thead>`;
  table += tableHeader;
  table += `</thead>`;
  table += `<tbody>`;
  table += tableRows;
  table += `</tbody>`;
  table += `</table>`;

  el.innerHTML = table;
}
