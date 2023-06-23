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
        rowIndex === 0
          ? `<th class="p-1">${column}</th>`
          : `<td class="p-1">${column}</td>`;
    });
    if (rowIndex === 0) {
      tableHeader += `<tr>${tableColumns}</tr>`;
    } else {
      tableRows += `<tr class="divide-x divide-gray-200 odd:bg-gray-50">${tableColumns}</tr>`;
    }
  });

  table += `<table class="min-w-full divide-y divide-gray-300 text-left text-sm text-gray-900">`;
  table += `<thead class="font-semibold bg-gray-200">`;
  table += tableHeader;
  table += `</thead>`;
  table += `<tbody class="divide-y divide-gray-200">`;
  table += tableRows;
  table += `</tbody>`;
  table += `</table>`;

  el.innerHTML = table; // eslint-disable-line
}

export const isCsv = (ext) => ext.toLowerCase() === "csv";

export const isImg = (ext) =>
  ["gif", "jpg", "jpeg", "png", "svg"].includes(ext.toLowerCase());

export const canDisplay = (ext) => isCsv(ext) || isImg(ext);
