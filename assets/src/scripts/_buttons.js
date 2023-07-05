export const btnStyles = {
  default: `inline-flex items-center justify-center shadow-sm transition-buttons duration-200 px-4 py-2 text-sm font-medium`,
  success: `bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:bg-green-700 focus:ring-green-500 focus:ring-offset-white`,
  successOutline: `bg-transparent border border-green-700 text-green-700 hover:bg-green-100 focus:bg-green-100 focus:ring-green-500 focus:ring-offset-white`,
  secondaryOutline: `bg-transparent border border-slate-400/75 text-slate-700 !shadow-none hover:bg-slate-200 focus:bg-slate-200 focus:ring-slate-500 focus:ring-offset-white`,
  warning: `bg-red-600 text-white border border-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-white`,
  warningOutline: `bg-transparent border border-red-700 text-red-700 hover:bg-red-100 focus:bg-red-100 focus:ring-red-500 focus:ring-offset-white`,
  disabled: `cursor-not-allowed !bg-slate-300 !text-slate-800 !border-slate-400`,
  notDisabled: `hover:shadow-lg focus:outline-none focus:ring-current`,
};

/**
 * Set button styling depending on if it should be active or not
 * @param {Node} button - HTML Node
 * @param {string.<btnStyles>} variant - select the style (without `Outline`) that will be swapped
 * @param {boolean} state - should the button be set to active (true) or inactive (false)
 */
export function setButtonActive(button, variant, state) {
  if (state === true) {
    btnStyles?.[`${variant}Outline`]
      .split(" ")
      .map((style) => button.classList.remove(style));
    btnStyles?.[variant].split(" ").map((style) => button.classList.add(style));
  } else {
    btnStyles?.[variant]
      .split(" ")
      .map((style) => button.classList.remove(style));
    btnStyles?.[`${variant}Outline`]
      .split(" ")
      .map((style) => button.classList.add(style));
  }
}
