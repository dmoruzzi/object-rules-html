const DEFAULT_OBJECT = "OBJECT_Rules";
const DEFAULT_RELEASE = "release_V1.0.0";

document.addEventListener("DOMContentLoaded", () => {
  initializeLocalStorageValues();
  initializeEventListeners();
  updateOutput();
  handleOrgAliasInput();
  handleReleaseBranchInput();
  attachCopyHandlerToPreElements();
});

function initializeLocalStorageValues() {
  const release = localStorage.getItem("release") || "";
  const defaultOrg = localStorage.getItem("defaultOrg") || "";

  document.getElementById("releaseField").value = release;
  document.getElementById("orgField").value = defaultOrg;
}

function attachCopyHandlerToPreElements() {
  document.querySelectorAll("pre").forEach((pre) => {
    pre.addEventListener("click", () => {
      navigator.clipboard
        .writeText(pre.textContent)
        .then(() => flashCopiedFeedback(pre))
        .catch((error) => console.error("Failed to copy:", error));
    });
  });
}

function flashCopiedFeedback(element) {
  element.classList.add("copied");
  setTimeout(() => element.classList.remove("copied"), 1000);
}

function initializeEventListeners() {
  document
    .querySelectorAll("#inputField, #taskField, #orgField, #releaseField")
    .forEach((field) => field.addEventListener("input", handleInput));
}

function handleInput(event) {
  const { id } = event.target;

  if (id === "orgField") handleOrgAliasInput();
  if (id === "releaseField") handleReleaseBranchInput();

  updateOutput();
}

function handleOrgAliasInput() {
  const orgAlias = document.getElementById("orgField").value.trim();
  const orgCmdStr = orgAlias ? `-u ${orgAlias}` : "";

  document.querySelectorAll(".OrgAliasCmd").forEach((orgCmd) => {
    orgCmd.textContent = orgCmdStr;
  });
}

function handleReleaseBranchInput() {
  const sourceBranch = document.getElementById("releaseField").value.trim();
  const releaseBranchText = sourceBranch
    ? `origin/${sourceBranch}`
    : `origin/<b><span style="color:red;">${DEFAULT_RELEASE}</b></span>`;

  document.getElementById("releaseBranch").innerHTML = releaseBranchText;
}

function getStoredObject() {
  return localStorage.getItem("object") || DEFAULT_OBJECT;
}

function updateOutput() {
  const inputValue = document.getElementById("inputField").value;
  const taskValue = document.getElementById("taskField").value;
  const objectName = getStoredObject();
  const featureId = extractFeatureOrBugId(inputValue);

  const rulesXml = generateRulesXml(
    (inputValue.match(/Rules:\s*(.*)/) || [])[1] || "",
    objectName
  );
  const packageXml = rulesXml.trim()
    ? `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        ${rulesXml}
        <name>CustomMetadata</name>
    </types>
    <version>59.0</version>
</Package>`
    : "";

  document.getElementById("package").textContent = packageXml;

  console.log(`featureId: ${featureId} & taskId: ${taskValue}`);
  const commitMessage = [
    featureId && `AB#${featureId}`,
    taskValue && `AB#${taskValue}`,
    objectName.replace(/_/g, " "),
  ]
    .filter(Boolean)
    .join(" ");
  document
    .querySelectorAll("#commitMsgFt, #commitMsgInt, #commitMsgQa")
    .forEach((el) => (el.textContent = commitMessage));

  const branchName = generateBranchName(objectName, featureId, taskValue);
  document
    .querySelectorAll(
      "#gitBranch, #gitBranchFt, #gitBranchInt, #gitBranchQa, #gitBranchInt2, #gitBranchQa2, #gitBranchInt3, #gitBranchQa3"
    )
    .forEach((el) => (el.textContent = branchName));

  document
    .querySelectorAll("#objectNameFt, #objectNameInt, #objectNameQa")
    .forEach((el) => (el.textContent = objectName));
}

function extractFeatureOrBugId(input) {
  const match = input.match(/Feature\/Bug:\s*(\S+)/);
  return match ? match[1].split("/").filter(Boolean).pop() : null;
}

function generateRulesXml(rules, objectName) {
  return rules
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => `<members>${objectName}.${rule}</members>`)
    .join("\n        ");
}

function generateBranchName(objectName, featureId, taskValue) {
  const shortObjectName = getStoredObject()
    .split("_")[0]
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (featureId && !isNaN(featureId) && taskValue) {
    return `feature/ft-${featureId}-${shortObjectName}-${taskValue}`;
  } else if (featureId && !isNaN(featureId)) {
    return `feature/ft-${featureId}-${shortObjectName}-${Date.now()}`;
  } else if (taskValue) {
    return `feature/${shortObjectName}-${taskValue}`;
  } else {
    return `feature/${shortObjectName}-${Date.now()}`;
  }
}
