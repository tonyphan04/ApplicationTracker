// Fetch and render applications.json with pagination

const PAGE_SIZE = 20;
let applications = [];
let filteredApps = [];
let currentPage = 1;

async function fetchApplications() {
  const res = await fetch("../backend/applications.json");
  applications = await res.json();
  filteredApps = applications;
  renderTable();
  renderPagination();
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = filteredApps.slice(start, end);
  let html =
    "<table><thead><tr>" +
    "<th>#</th>" +
    "<th>Company</th>" +
    "<th>Title</th>" +
    "<th>Status</th>" +
    "<th>Applied Date</th>" +
    "</tr></thead><tbody>";
  pageData.forEach((app, idx) => {
    html += `<tr>
      <td>${start + idx + 1}</td>
      <td>${app.company}</td>
      <td>${app.title}</td>
      <td>${app.status}</td>
      <td>${app.appliedDate}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  document.querySelector(".app-table").innerHTML = html;
}

function renderPagination() {
  const totalPages = Math.ceil(filteredApps.length / PAGE_SIZE) || 1;
  document.querySelector(
    ".page-info"
  ).textContent = `Page ${currentPage} of ${totalPages}`;
  document.querySelector(".prev").disabled = currentPage === 1;
  document.querySelector(".next").disabled = currentPage === totalPages;
}

document.querySelector(".prev").onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
    renderPagination();
  }
};
document.querySelector(".next").onclick = () => {
  const totalPages = Math.ceil(filteredApps.length / PAGE_SIZE) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
    renderPagination();
  }
};

document.querySelector(".search-btn").onclick = () => {
  const query = document
    .querySelector(".search-input")
    .value.trim()
    .toLowerCase();
  filteredApps = applications.filter(
    (app) =>
      app.company.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query)
  );
  currentPage = 1;
  renderTable();
  renderPagination();
};

document.querySelector(".clear-btn").onclick = () => {
  document.querySelector(".search-input").value = "";
  filteredApps = applications;
  currentPage = 1;
  renderTable();
  renderPagination();
};

fetchApplications();
