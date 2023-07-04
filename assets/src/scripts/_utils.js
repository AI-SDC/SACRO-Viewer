import htm from "htm";
import vhtml from "vhtml";

export const html = htm.bind(vhtml);

export const getFileExt = (str) => str.split(`.`).pop();

export const isCsv = (ext) => ext.toLowerCase() === "csv";

export const isImg = (ext) =>
  ["gif", "jpg", "jpeg", "png", "svg"].includes(ext.toLowerCase());

export const canDisplay = (ext) => isCsv(ext) || isImg(ext);
