import { reviewUrl } from "./_data";

const formSetup = () => {
  const form = document.querySelector("#approveForm");
  const button = form.querySelector(`button[type="submit"]`);
  form.action = reviewUrl;

  button.classList.remove(
    "cursor-not-allowed",
    "bg-slate-300",
    "text-slate-800"
  );
  button.classList.add(
    "bg-blue-600",
    "text-white",
    "hover:bg-blue-700",
    "focus:bg-blue-700",
    "focus:ring-blue-500",
    "focus:ring-offset-white"
  );
  button.removeAttribute("disabled");
};

export default formSetup;
