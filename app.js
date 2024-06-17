const OBJECT_UNDEF = "OBJECT_Rules";

updateOutput();
document.getElementById("inputField").addEventListener("input", updateOutput);
document.getElementById("taskField").addEventListener("input", clipboardCopy);

function clipboardCopy() {
  updateOutput();
  const output = document.getElementById("package").textContent;
  navigator.clipboard.writeText(output);
}

function getDefaultTaskField() {
  return document.getElementById("taskField").value || Date.now();
}

function updateAbMsg() {
  const taskField = document.getElementById("taskField").value;
  const inputField = document.getElementById("inputField").value;
  let object = localStorage.getItem("object") || OBJECT_UNDEF;

  let ab_msg_string = "";
  if (taskField) {
    ab_msg_string += `AB#${taskField} `;
  }

  const ftIdMatch = inputField.match(/Feature\/Bug: (.*)/);
  if (ftIdMatch) {
    const ftId = ftIdMatch[1].trim().split("/").pop();
    if (!isNaN(ftId) && ftId.length > 0) {
      ab_msg_string += `AB#${ftId} `;
    }
  }

  object = object.replace(/_/g, " ");
  ab_msg_string += object;

  document
    .querySelectorAll("#ab_msg_ft, #ab_msg_int, #ab_msg_qa")
    .forEach((el) => (el.textContent = ab_msg_string));
}

function updateOutput() {
  const inputField = document.getElementById("inputField").value;
  const outputDiv = document.getElementById("package");
  const gitBranchDiv = document.getElementById("git_checkout_branch");

  const taskField = getDefaultTaskField();
  const object = localStorage.getItem("object") || OBJECT_UNDEF;
  const objShortName = object
    .split("_")[0]
    .toUpperCase()
    .replace(/[^a-zA-Z0-9]/g, "");

  let ftId = `feature/${objShortName}-`;
  const ftIdMatch = inputField.match(/Feature\/Bug: (.*)/);
  if (ftIdMatch) {
    const ftIdValue = ftIdMatch[1].trim().split("/").pop();
    ftId =
      !isNaN(ftIdValue) && ftIdValue.length > 0
        ? `feature/ft-${ftIdValue}-${objShortName}-`
        : ftId;
  }

  const rulesMatch = inputField.match(/Rules: (.*)/);
  let rules = [];
  if (rulesMatch) {
    rules = rulesMatch[1]
      .trim()
      .split(",")
      .map((rule) => `<members>${object}.${rule.trim()}</members>`)
      .filter((rule) => rule !== "");
  }

  let output = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata"> 
    <types>
`;

  rules.forEach((rule) => {
    output += `        ${rule}\n`;
  });

  output += `        <name>CustomMetadata</name>
    </types>
    <version>59.0</version>
</Package>`;

  updateAbMsg();
  outputDiv.textContent = output;
  const branch = `${ftId}${taskField}`;
  gitBranchDiv.textContent = `git checkout -b ${branch}`;
  document.getElementById("release_branch").innerHTML =
    'origin/<font color="red">release_<b>V1.0.0</b></font>';

  document
    .querySelectorAll(
      "#git_branch_ft, #git_branch_int, #git_branch_qa, #git_branch_int2, #git_branch_qa2, #git_branch_int3, #git_branch_qa3"
    )
    .forEach((el) => (el.textContent = branch));

  document
    .querySelectorAll("#objectName_ft, #objectName_int, #objectName_qa")
    .forEach((el) => (el.textContent = object));
}
