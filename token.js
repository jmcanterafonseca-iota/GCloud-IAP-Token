import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import fetch from "node-fetch";

class TokenRetriever {
  constructor(keys, client_id) {
    // The keys for self-signing
    this.keys = keys;
    // The client_id concerned
    this.client_id = client_id;

    // The token returned
    this.id_token = null;

    // Whether we are in the middle of an id_token Request
    this.tokenRequested = false;
    // Event emitter for dealing with concurrency of token requests
    this.emitter = new EventEmitter();
  }

  setKeys(keys) {
    this.keys = keys;
  }

  set_client_id(client_id) {
    this.client_id = client_id;
  }

  get_id_token() {
    if (this.id_token) {
      return Promise.resolve(this.id_token);
    }

    return this.getNewToken();
  }

  postAuthServer(jtwSelfSigned) {
    const reqHeaders = new fetch.Headers();
    reqHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("assertion", jtwSelfSigned);
    urlencoded.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    urlencoded.append("scope", "openid");

    const requestOptions = {
      method: 'POST',
      headers: reqHeaders,
      body: urlencoded,
      redirect: 'follow'
    };

    return fetch(this.keys.token_uri, requestOptions);
  }

  getNewToken() {
    return new Promise((resolve, reject) => {
      if (!this.tokenRequested) {
        this.id_token = null;
        this.tokenRequested = true;

        const jwtToken = this.selfSignJwt();

        this.postAuthServer(jwtToken).then(async (response) => {
          let data;
          try {
            if (response.status === 200) {
              data = await response.text();
            }
            else {
              throw Error(`Token retrieval error: ${response.status} ${await response.text()}`);
            }
          }
          catch (error) {
            this.tokenRequested = false;
            reject(error);
            this.emitter.emit("error", error);
            return;
          }

          this.id_token = JSON.parse(data).id_token;
          resolve(this.id_token);

          this.tokenRequested = false;

          // Notify all possible listeners waiting
          this.emitter.emit("token");
        }, error => {
          this.tokenRequested = false;
          reject(error);
          this.emitter.emit("error", error);
        });

      }
      else {
        const tokenFunction = () => {
          this.emitter.off("error", errorFunction);
          resolve(this.id_token);
        };

        const errorFunction = (error) => {
          this.emitter.off("token", tokenFunction);
          reject(error);
        }

        // Wait for the pending request
        this.emitter.once("token", tokenFunction);
        this.emitter.once("error", errorFunction);
      }
    });
  }

  selfSignJwt() {
    const payload = {
      "iss": this.keys.client_email,
      "sub": this.keys.client_email,
      "aud": this.keys.token_uri,
      "target_audience": this.client_id,
      "exp": new Date() / 1000 + 120
    };

    const token = jwt.sign(payload, this.keys.private_key, {
      algorithm: "RS256",
    });

    return token;
  }

  refresh_id_token() {
    this.id_token = null;

    return this.getNewToken();
  }
}

export const tokenRetriever = new TokenRetriever();

/*
 const keys = await import("./iota-test-keys.json");
 const tr = new TokenRetriever(keys);
 const token = await tr.get();

 const result = await http.get();

 if (result.status === 401) {
   const token = tr.refresh();
   tr.refresh();
 }
*/
