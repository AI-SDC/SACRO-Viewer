import Papa from "papaparse";
import { html } from "./_utils";

/**
 * @param {Object} params
 * @param {Object.<string, string[]>} params.outcome
 * @param {string} params.tableId
 */
function highlightFailingCells({ outcome, tableId }) {
  /** @type {HTMLElement|null} */
  const tableBody = document.getElementById(tableId);
  if (!tableBody) return;

  Object.keys(outcome).forEach((index) => {
    const x = parseFloat(index.split(",")[0]) + 1;
    const y = parseFloat(index.split(",")[1]) + 2;

    /** @type {HTMLTableCellElement|null} */
    const tableCell = tableBody.querySelector(
      `tr:nth-child(${x}) > td:nth-child(${y})`
    );
    if (!tableCell) return;

    tableCell.classList.add(
      "bg-red-50",
      "!border",
      "!border-red-600",
      "text-red-900",
      "relative",
      "group",
      "cursor-pointer"
    );

    /** @type {string} */
    const tooltipContent = outcome[index]
      .map(
        (/** @type {string} */ str) => html`<span class="block">${str}</span>`
      )
      .join("");

    const tooltipTemplateEl = document.getElementById(`tooltip`);
    if (!(tooltipTemplateEl instanceof HTMLTemplateElement)) return;
    const tooltipEl = tooltipTemplateEl?.content?.firstElementChild;
    if (!tooltipEl) return;

    const cellTooltip = tooltipEl.cloneNode(true);
    tableCell.appendChild(cellTooltip);

    const tooltip = tableCell.querySelector("span:first-child");
    if (tooltip) {
      tooltip.classList.add("flex", "-bottom-2");

      const tooltipContentSpan = tooltip?.querySelector(
        `[data-sacro-el="tooltip-content"]`
      );
      if (tooltipContentSpan) {
        tooltipContentSpan.innerHTML = tooltipContent;
      }
    }
  });
}

/**
 *
 * @param {object} params
 * @param {Object.<string, string[]>} params.outcome
 * @param {HTMLElement} params.el
 * @param {string} params.csvString
 * @param {string} params.fileIndex
 */
function tableBuilder({ csvString, el, outcome, fileIndex }) {
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

  const tableHtmlStr = html`
    <table
      id=${`csvTable${fileIndex}`}
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

  if (typeof tableHtmlStr === "string") {
    el.innerHTML = tableHtmlStr; // eslint-disable-line no-param-reassign

    highlightFailingCells({
      outcome,
      tableId: `csvTable${fileIndex}`,
    });
  }
}

export default tableBuilder;
