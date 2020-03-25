const axios = require("axios");
const Uploader = require("./uploader");

const main = async () => {
  const uploader = new Uploader(axios, "/api_v1/users/203453/files", "thisisatoken");

  const input = document.getElementById("myfile");
  input.onchange = e => {
    console.log(e);
    uploader.upload(e.target.files[0], console.log.bind(console, "Process changed log"));
  };
};

main();
