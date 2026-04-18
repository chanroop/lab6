import express from "express";
import mysql from "mysql2/promise";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const conn = mysql.createPool({
  host: process.env.DB_HOST || "z37udk8g6jiaqcbx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: process.env.DB_USER || "g33tafinamntva5d",
  password: process.env.DB_PASSWORD || "ym6yq6nirz1v3fpq",
  database: process.env.DB_NAME || "wuv3pjnaf30hm0jr"
});

async function getAuthors() {
  const sql = `
    SELECT authorId, firstName, lastName
    FROM q_authors
    ORDER BY lastName, firstName
  `;
  const [rows] = await conn.query(sql);
  return rows;
}

async function getCategories() {
  const sql = `
    SELECT DISTINCT category
    FROM q_quotes
    WHERE category IS NOT NULL AND category <> ''
    ORDER BY category
  `;
  const [rows] = await conn.query(sql);
  return rows.map(row => row.category);
}

app.get("/dbTest", async (req, res) => {
  const [rows] = await conn.query("SELECT CURDATE() AS today");
  res.send(rows);
});

app.get("/", async (req, res) => {
  const authors = await getAuthors();
  res.render("index", { authors });
});

app.get("/searchByKeyword", async (req, res) => {
  const keyword = req.query.keyword || "";

  const sql = `
    SELECT q.quoteId, q.authorId, a.firstName, a.lastName, q.quote, q.category, q.likes
    FROM q_quotes q
    JOIN q_authors a ON q.authorId = a.authorId
    WHERE q.quote LIKE ?
    ORDER BY q.likes DESC, a.lastName
  `;

  const [rows] = await conn.query(sql, [`%${keyword}%`]);
  res.render("results", { quotes: rows, title: `Results for "${keyword}"` });
});

app.get("/searchByAuthor", async (req, res) => {
  const authorId = req.query.authorId;

  const sql = `
    SELECT q.quoteId, q.authorId, a.firstName, a.lastName, q.quote, q.category, q.likes
    FROM q_quotes q
    JOIN q_authors a ON q.authorId = a.authorId
    WHERE q.authorId = ?
    ORDER BY q.likes DESC, q.quote
  `;

  const [rows] = await conn.query(sql, [authorId]);
  res.render("results", { quotes: rows, title: "Quotes by Author" });
});

app.get("/api/author/:id", async (req, res) => {
  const id = req.params.id;
  const sql = `SELECT * FROM q_authors WHERE authorId = ?`;
  const [rows] = await conn.query(sql, [id]);
  res.json(rows[0] || {});
});

/* -------------------- ADMIN HOME -------------------- */
app.get("/admin", (req, res) => {
  res.render("admin");
});

/* -------------------- AUTHORS -------------------- */
app.get("/authors", async (req, res) => {
  const sql = `
    SELECT authorId, firstName, lastName, profession, country, sex
    FROM q_authors
    ORDER BY lastName, firstName
  `;
  const [authors] = await conn.query(sql);
  res.render("authors", { authors });
});

app.get("/authors/new", async (req, res) => {
  res.render("author-form", {
    pageTitle: "Add Author",
    formAction: "/authors/new",
    author: {
      firstName: "",
      lastName: "",
      dob: "",
      dod: "",
      sex: "",
      profession: "",
      country: "",
      portrait: "",
      biography: ""
    }
  });
});

app.post("/authors/new", async (req, res) => {
  const {
    firstName,
    lastName,
    dob,
    dod,
    sex,
    profession,
    country,
    portrait,
    biography
  } = req.body;

  const sql = `
    INSERT INTO q_authors
    (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await conn.query(sql, [
    firstName,
    lastName,
    dob || null,
    dod || null,
    sex,
    profession,
    country,
    portrait,
    biography
  ]);

  res.redirect("/authors");
});

app.get("/authors/edit/:id", async (req, res) => {
  const authorId = req.params.id;
  const sql = `SELECT * FROM q_authors WHERE authorId = ?`;
  const [rows] = await conn.query(sql, [authorId]);

  res.render("author-form", {
    pageTitle: "Edit Author",
    formAction: `/authors/edit/${authorId}`,
    author: rows[0]
  });
});

app.post("/authors/edit/:id", async (req, res) => {
  const authorId = req.params.id;
  const {
    firstName,
    lastName,
    dob,
    dod,
    sex,
    profession,
    country,
    portrait,
    biography
  } = req.body;

  const sql = `
    UPDATE q_authors
    SET firstName = ?,
        lastName = ?,
        dob = ?,
        dod = ?,
        sex = ?,
        profession = ?,
        country = ?,
        portrait = ?,
        biography = ?
    WHERE authorId = ?
  `;

  await conn.query(sql, [
    firstName,
    lastName,
    dob || null,
    dod || null,
    sex,
    profession,
    country,
    portrait,
    biography,
    authorId
  ]);

  res.redirect("/authors");
});

app.post("/authors/delete/:id", async (req, res) => {
  const authorId = req.params.id;

  await conn.query("DELETE FROM q_quotes WHERE authorId = ?", [authorId]);
  await conn.query("DELETE FROM q_authors WHERE authorId = ?", [authorId]);

  res.redirect("/authors");
});

/* -------------------- QUOTES -------------------- */
app.get("/quotes", async (req, res) => {
  const sql = `
    SELECT q.quoteId, q.quote, q.category, q.likes, a.firstName, a.lastName
    FROM q_quotes q
    JOIN q_authors a ON q.authorId = a.authorId
    ORDER BY a.lastName, q.quote
  `;
  const [quotes] = await conn.query(sql);
  res.render("quotes", { quotes });
});

app.get("/quotes/new", async (req, res) => {
  const authors = await getAuthors();
  const categories = await getCategories();

  res.render("quote-form", {
    pageTitle: "Add Quote",
    formAction: "/quotes/new",
    quote: {
      quote: "",
      authorId: "",
      category: "",
      likes: 0
    },
    authors,
    categories
  });
});

app.post("/quotes/new", async (req, res) => {
  const { quote, authorId, category, likes } = req.body;

  const sql = `
    INSERT INTO q_quotes
    (quote, authorId, category, likes)
    VALUES (?, ?, ?, ?)
  `;

  await conn.query(sql, [quote, authorId, category, likes || 0]);
  res.redirect("/quotes");
});

app.get("/quotes/edit/:id", async (req, res) => {
  const quoteId = req.params.id;
  const authors = await getAuthors();
  const categories = await getCategories();

  const sql = `SELECT * FROM q_quotes WHERE quoteId = ?`;
  const [rows] = await conn.query(sql, [quoteId]);

  res.render("quote-form", {
    pageTitle: "Edit Quote",
    formAction: `/quotes/edit/${quoteId}`,
    quote: rows[0],
    authors,
    categories
  });
});

app.post("/quotes/edit/:id", async (req, res) => {
  const quoteId = req.params.id;
  const { quote, authorId, category, likes } = req.body;

  const sql = `
    UPDATE q_quotes
    SET quote = ?,
        authorId = ?,
        category = ?,
        likes = ?
    WHERE quoteId = ?
  `;

  await conn.query(sql, [quote, authorId, category, likes || 0, quoteId]);
  res.redirect("/quotes");
});

app.post("/quotes/delete/:id", async (req, res) => {
  const quoteId = req.params.id;
  await conn.query("DELETE FROM q_quotes WHERE quoteId = ?", [quoteId]);
  res.redirect("/quotes");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
