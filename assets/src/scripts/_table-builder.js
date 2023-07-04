import Papa from "papaparse";
import { html } from "./_utils";

const indexOfAll = (arr, val) =>
  arr.reduce((acc, el, i) => (el !== val ? [...acc, i] : acc), []);

function tableBuilder({ csvString, el, outcome }) {
  const csvToJson = Papa.parse(csvString).data;

  const bodyCell = (row) =>
    row.map((cell) => html`<td class="p-1">${cell}</td>`);
  const bodyRows = csvToJson.map((row, i) =>
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
          ${csvToJson[0].map((cell) => html`<th>${cell}</th>`)}
        </tr>
      </thead>
      <tbody id="csvBody" class="divide-y divide-gray-200">
        ${bodyRows}
      </tbody>
    </table>
  `;

  el.innerHTML = table; // eslint-disable-line no-param-reassign

  Object.keys(outcome).map((key) => {
    const rows = indexOfAll(Object.values(outcome[key]), "ok");
    const column = csvToJson[0].findIndex((val) => val === key);

    const colData = rows.map((row) => {
      const tableBody = document.getElementById("csvBody");
      const tableRow = tableBody.children[row];
      const tableCell = tableRow.children[column];

      tableCell.innerHTML = Object.values(outcome[key])
        [row].split("; ")
        .filter((i) => i !== "")
        .map((i) => html`<span class="block">${i}</span>`)
        .join("");

      return tableCell.classList.add(
        "bg-red-50",
        "!border",
        "!border-red-600",
        "text-red-900"
      );
    });

    return colData;
  });
}

export default tableBuilder;
