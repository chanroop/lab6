let links = document.querySelectorAll(".authorLink");

for (let link of links) {
  link.addEventListener("click", async function(e) {
    e.preventDefault();

    let response = await fetch(`/api/author/${this.id}`);
    let data = await response.json();

    document.querySelector("#authorInfo").innerHTML =
      data[0].firstName + " " + data[0].lastName;
  });
}