const CryptoJS = require("crypto-js");

const pbKey = "pat@123";
class Crypto {
  static instance;
  constructor() {
    this.pvKey = pbKey;
  }

  setPVKey(pvKey) {
    this.pvKey = pvKey;
  }

  encrypt(data) {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }

    let eData = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(data),
      // this.getPBKey(),
      // this.getDecrPrivateKey(this.getPBKey()),
      this.getPVKey(),
      {
        keySize: 128 / 8,
        iv: CryptoJS.enc.Utf8.parse(""),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return eData.toString();
  }

  getPBKey() {
    return CryptoJS.enc.Utf8.parse(pbKey);
  }

  getPVKey() {
    return this.pvKey;
  }

  getDecrPrivateKey(utf8PublicKey) {
    return CryptoJS.AES.decrypt(this.getPVKey(), utf8PublicKey, {
      keySize: 128 / 8,
      iv: CryptoJS.enc.Utf8.parse(""),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
  }

  decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(
        encryptedData,
        // this.getPBKey(),
        // this.getDecrPrivateKey(this.getPBKey()),
        this.getPVKey(),

        {
          keySize: 128 / 8,
          iv: CryptoJS.enc.Utf8.parse(""),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }

  static getInstance() {
    if (!Crypto.instance) {
      Crypto.instance = new Crypto();
    }

    return Crypto.instance;
  }
}

const commonCrypto = Crypto.getInstance();

module.exports=commonCrypto;