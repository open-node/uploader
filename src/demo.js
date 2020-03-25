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
  input.onchange = async e => {
    console.log(e);
    const file = await uploader.upload(
      e.target.files[0],
      console.log.bind(console, "Progress changed log")
    );
    console.log("Upload file success: %o", file);
  };
};

main();
