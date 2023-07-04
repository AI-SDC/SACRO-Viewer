import htm from "htm";
import Papa from "papaparse";
import vhtml from "vhtml";
import { csvData } from "./_signals";

export const getFileExt = (str) => str.split(`.`).pop();

export function csvStringToTable(csvString, el) {
  const html = htm.bind(vhtml);
  const csvToJson = Papa.parse(csvString).data;
  csvData.value = csvToJson;

  const bodyCell = (row) =>
    row.map((cell) => html`<td class="p-1">${cell}</td>`);
  const bodyRows = csvData.value.map((row, i) =>
    i > 0
      ? html`<tr class="divide-x divide-gray-200 odd:bg-gray-50">
          ${bodyCell(row)}
        </tr>`
      : ``
  );

  const table = html`
    <table
      id="csvTable"
      class="min-w-full divide-y divide-gray-300 text-left text-sm text-gray-900"
    >
      <thead class="font-semibold bg-gray-200">
        <tr>
          ${csvData.value[0].map((cell) => html`<th>${cell}</th>`)}
        </tr>
      </thead>
      <tbody id="csvBody" class="divide-y divide-gray-200">
        ${bodyRows}
      </tbody>
    </table>
  `;

  el.innerHTML = table; // eslint-disable-line no-param-reassign
}

export const isCsv = (ext) => ext.toLowerCase() === "csv";

export const isImg = (ext) =>
  ["gif", "jpg", "jpeg", "png", "svg"].includes(ext.toLowerCase());

export const canDisplay = (ext) => isCsv(ext) || isImg(ext);
