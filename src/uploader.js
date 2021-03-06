const SparkMD5 = require("spark-md5");

const saveKey = hash => `OpenNode-Uploader-${hash}`;

const DEFAULT_OPT = Object.freeze({
  chunkSize: 2 * 1024 * 1024, // 分片大小，默认 2MB
  getState(hash) {
    const str = localStorage.getItem(saveKey(hash));
    if (!str) return [];
    return str.split(",").map(x => x | 0);
  },
  setState(hash, state) {
    if (state) {
      localStorage.setItem(saveKey(hash), Array.from(state).join(","));
    } else {
      localStorage.removeItem(saveKey(hash));
    }
  }
});

/**
 * @open-node/uploader 大文件分片上传客户端JDK
 * @param {object} axios axios 发起请求库包
 * @param {string} url 上传地址
 * @param {string} token 身份认证信息，会通过头信息 X-Auth-Token 提交
 *
 * @class
 * @return {Uploader} Instance
 */
function Uploader(axios, url, headers) {
  const opt = Object.assign({}, DEFAULT_OPT);

  /**
   * 计算文件MD5值
   * @memberof Uploader
   * @instance
   *
   * @param {File} file HTML5 选择文件后的对象
   *
   * @return {string} 文件md5 hash值
   */
  const md5 = async file => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const total = Math.ceil(file.size / opt.chunkSize);
    let current = 0;
    const loadNext = () => {
      const start = current * opt.chunkSize;
      const end = Math.min(file.size, start + opt.chunkSize);
      reader.readAsArrayBuffer(file.slice(start, end));
    };
    return new Promise((resolve, reject) => {
      reader.onload = e => {
        spark.append(e.target.result);
        current += 1;
        if (current < total) {
          loadNext();
        } else {
          resolve(spark.end());
        }
      };

      reader.onerror = reject;
      // 启动读取
      loadNext();
    });
  };

  /**
   * 执行文件分片上传
   * @memberof Uploader
   * @instance
   *
   * @param {File} file HTML5 选择后的文件对象
   * @param {Function} changed 上传进度百分比变化调用函数
   * @return {Response} 服务端上传完毕返回值
   */
  const upload = async (file, changed) => {
    const hash = await md5(file);
    const completed = new Set(opt.getState(hash));
    const length = Math.ceil(file.size / opt.chunkSize);
    const requests = [];
    let loaded = 0;
    const progress = Array(length).fill(0);
    const onUploadProgress = (i, e) => {
      loaded -= progress[i];
      loaded += e.loaded;
      progress[i] = e.loaded;
      changed(Math.floor((loaded * 100) / file.size));
      if (e.loaded === e.total) {
        completed.add(i);
        opt.setState(hash, completed);
      }
    };
    for (let i = 0; i < length; i += 1) {
      // 已经完成的分片直接跳过
      if (completed.has(i)) continue;
      // 利用axios.post 方法上传
      const option = {
        headers,
        onUploadProgress: onUploadProgress.bind(null, i)
      };

      const form = new FormData();
      const start = i * opt.chunkSize;
      const end = Math.min(file.size, start + opt.chunkSize);
      form.append("file", file.slice(start, end));
      form.append("index", i);
      form.append("total", length);
      form.append("hash", hash);
      form.append("size", file.size);
      requests.push(axios.put(url, form, option));
    }

    await axios.all(requests);
    const body = {
      hash,
      size: file.size,
      total: length,
      name: file.name
    };
    const { data } = await axios.post(url, body, { headers });
    opt.setState(hash); // 删除本地分片上传记录, 因为已经完成，这些记录没有意义了。
    return data;
  };

  /**
   * 读取/修改设置
   * @memberof Uploader
   * @instance
   *
   * @param {string} key 设置项目
   * @param {any} value 设置的值
   * @return {void}
   */
  const changeOpt = (key, value) => {
    if (!Object.hasOwnProperty.call(opt, key)) throw Error(`Not found the opt item: ${key}`);
    if (typeof opt[key] !== typeof value)
      throw Error(`Type error, opt item: ${key} type is ${typeof opt[key]}`);
    opt[key] = value;
  };

  return { upload, changeOpt, md5 };
}

module.exports = Uploader;
