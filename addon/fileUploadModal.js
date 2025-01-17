const modal = document.getElementById("uploadModal");
const fileInput = document.getElementById("fileUpload");
const dropZone = document.getElementById("dropZone");
const fileList = document.getElementById("fileList");

// Function to show modal
function showModal() {
  modal.classList.add("show");
}

// Function to hide modal
function hideModal() {
  modal.classList.remove("show");
}

// Function to handle file selection
function handleFiles(files) {
  const filesArray = Array.from(files);
  storeDataInIndexedDB("files", filesArray);
  window.location.reload();
}

// Event listeners
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#3b82f6";
  dropZone.style.backgroundColor = "#f8fafc";
};

dropZone.ondragleave = () => {
  dropZone.style.borderColor = "#e5e7eb";
  dropZone.style.backgroundColor = "transparent";
};

dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#e5e7eb";
  dropZone.style.backgroundColor = "transparent";
  handleFiles(e.dataTransfer.files);
};

modal.onclick = (e) => {
  if (e.target === modal) hideModal();
};

