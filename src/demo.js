const axios = require("axios");
const Uploader = require("./uploader");

const main = async () => {
  const headers = {
    "X-Auth-Token": "thisisatoken",
    "X-Auth-AppId": "i03n111cgy"
  };
  const uploader = new Uploader(axios, "/api_v1/app/files/slices", headers);
  uploader.changeOpt("chunkSize", 2 * 1024 * 1024);

  const input = document.getElementById("myfile");
  input.onchange = e => {
    console.log(e);
    uploader.upload(e.target.files[0], console.log.bind(console, "Process changed log"));
  };
};

main();
