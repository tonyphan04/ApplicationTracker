// Fetch and render applications.json with pagination
const PAGE_SIZE = 20;
let applications = [];
let currentPage = 1;

async function fetchApplications() {
  // Try to fetch from the backend folder (adjust path if needed)
  const res = await fetch("../backend/applications.json");
  applications = await res.json();
  renderTable();
  renderPagination();
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = applications.slice(start, end);
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
  document.getElementById("app-table").innerHTML = html;
}

function renderPagination() {
  const totalPages = Math.ceil(applications.length / PAGE_SIZE);
  document.getElementById(
    "page-info"
  ).textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prev").disabled = currentPage === 1;
  document.getElementById("next").disabled = currentPage === totalPages;
}

document.getElementById("prev").onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
    renderPagination();
  }
};
document.getElementById("next").onclick = () => {
  const totalPages = Math.ceil(applications.length / PAGE_SIZE);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
    renderPagination();
  }
};

fetchApplications();
