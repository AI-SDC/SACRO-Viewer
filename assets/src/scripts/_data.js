const outputs = JSON.parse(document.getElementById("outputData").textContent);

export const reviewableOutputs = Object.fromEntries(
  Object.entries(outputs).filter(
    ([name]) =>
      name !== "2ndary_risk_summary_json-DONT_RELEASE" &&
      name !== "2ndary_risk_summary_csv-DONT_RELEASE"
  )
);

export default outputs;
