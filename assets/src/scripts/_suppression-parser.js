import { csvData } from "./_signals";
import { html } from "./_utils";

const indexOfAll = (arr, val) =>
  arr.reduce((acc, el, i) => (el !== val ? [...acc, i] : acc), []);

function suppressionParser({ outcome }) {
  const cellData = [];

  Object.keys(outcome).map((key) => {
    const rows = indexOfAll(Object.values(outcome[key]), "ok");
    const column = csvData.value[0].findIndex((val) => val === key);

    const colData = rows.map((row) => ({
      column,
      row,
      comment: Object.values(outcome[key])[row],
    }));

    return cellData.push(colData);
  });

  return cellData.flatMap((x) => x);
}

function cellBorder({ outcome }) {
  const getInfo = suppressionParser({ outcome });
  if (!getInfo.length) return;

  const tableBody = document.getElementById("csvBody");
  if (!tableBody?.children.length) return;

  getInfo.map(({ column, row, comment }) => {
    const tableRow = tableBody.children[row];
    const tableCell = tableRow.children[column];

    tableCell.innerHTML = comment
      .split("; ")
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
}

export { cellBorder, suppressionParser };
