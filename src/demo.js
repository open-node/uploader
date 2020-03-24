const Uploader = require("./uploader");
const axios = require("axios");

const main = async () => {
  const uploader = new Uploader(axios, "/api_v1/users/203453/files", "thisisatoken");

  const input = document.getElementById("myfile");
  input.onchange = e => {
    console.log(e);
    debugger;
  };
};

main();
