const links = document.querySelectorAll(".authorLink");
const authorInfo = document.querySelector("#authorInfo");

for (const link of links) {
  link.addEventListener("click", async function () {
    const authorId = this.dataset.authorid;

    authorInfo.innerHTML = "Loading...";

    const response = await fetch(`/api/author/${authorId}`);
    const data = await response.json();

    authorInfo.innerHTML = `
      <div class="row g-4">
        <div class="col-md-4">
          <img src="${data.portrait}" alt="${data.firstName} ${data.lastName}" class="img-fluid rounded shadow-sm">
        </div>
        <div class="col-md-8">
          <h3 class="mb-3">${data.firstName} ${data.lastName}</h3>
          <p><strong>Profession:</strong> ${data.profession || ""}</p>
          <p><strong>Country:</strong> ${data.country || ""}</p>
          <p><strong>Sex:</strong> ${data.sex || ""}</p>
          <p><strong>Date of Birth:</strong> ${data.dob || ""}</p>
          <p><strong>Date of Death:</strong> ${data.dod || ""}</p>
          <p><strong>Biography:</strong><br>${data.biography || ""}</p>
        </div>
      </div>
    `;
  });
}
