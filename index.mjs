import express from "express";
import mysql from "mysql2/promise";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const conn = mysql.createPool({
  host: "z37udk8g6jiaqcbx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "g33tafinamntva5d",
  password: "ym6yq6nirz1v3fpq",
  database: "wuv3pjnaf30hm0jr"
});

app.get("/dbTest", async (req, res) => {
  let sql = "SELECT CURDATE()";
  const [rows] = await conn.query(sql);
  res.send(rows);
});

app.get("/", async (req, res) => {
  let sql = `
    SELECT authorId, firstName, lastName
    FROM q_authors
    ORDER BY lastName
  `;
  const [rows] = await conn.query(sql);
  res.render("index", { authors: rows });
});

app.get("/searchByKeyword", async (req, res) => {
  let keyword = req.query.keyword;

  let sql = `
    SELECT authorId, firstName, lastName, quote
    FROM q_quotes
    NATURAL JOIN q_authors
    WHERE quote LIKE ?
  `;

  const [rows] = await conn.query(sql, [`%${keyword}%`]);
  res.render("results", { quotes: rows });
});

app.get("/searchByAuthor", async (req, res) => {
  let authorId = req.query.authorId;

  let sql = `
    SELECT authorId, firstName, lastName, quote
    FROM q_quotes
    NATURAL JOIN q_authors
    WHERE authorId = ?
  `;

  const [rows] = await conn.query(sql, [authorId]);
  res.render("results", { quotes: rows });
});

app.get("/api/author/:id", async (req, res) => {
  let id = req.params.id;

  let sql = `SELECT * FROM q_authors WHERE authorId = ?`;
  const [rows] = await conn.query(sql, [id]);

  res.send(rows);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on http://localhost:3000");
});
