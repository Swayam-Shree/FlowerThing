const port = process.env.PORT || 6969;

const express = require("express");
const app = express();

app.use(express.static("public"));
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});