import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import fetch from "node-fetch";

/**
 *  Provides the behaviour for obtaining a new Id Token to invoke an API
 *  protected by the Google's IAP
 * 
 */
class IdTokenFetch {
  /**
   * Constructor function
   * 
   * @param keys The keys used to sign JWT 
   * @param client_id The client id
   */
  constructor(keys, client_id) {
    // The token returned
    this._id_token = null;

    // Whether we are in the middle of an id_token Request
    this._tokenRequested = false;
    // Event emitter for dealing with concurrency of token requests
    this._emitter = new EventEmitter();

    // The keys for self-signing
    this._keys = keys;
    // The client_id concerned
    this._client_id = client_id;
  }

  /**
   * Sets the keys to be used
   * 
   * @param keys 
   */
  setKeys(keys) {
    this._keys = keys;
  }

  /**
   * Sets the concerned client id
   * 
   * @param client_id 
   */
  setClientId(client_id) {
    this._client_id = client_id;
  }

  /**
   *  Allows to obtain the id_token
   * 
   * @returns Promise
   * 
   */
  getToken() {
    if (this._id_token) {
      return Promise.resolve(this._id_token);
    }

    return this._getNewToken();
  }

  _postAuthServer(jtwSelfSigned) {
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

    return fetch(this._keys.token_uri, requestOptions);
  }

  _getNewToken() {
    return new Promise((resolve, reject) => {
      if (!this._tokenRequested) {
        this._id_token = null;
        this._tokenRequested = true;

        const jwtToken = this._selfSignJwt();

        this._postAuthServer(jwtToken).then(async (response) => {
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
            this._tokenRequested = false;
            reject(error);
            this._emitter.emit("error", error);
            return;
          }

          this._id_token = JSON.parse(data).id_token;
          resolve(this._id_token);

          this._tokenRequested = false;

          // Notify all possible listeners waiting
          this._emitter.emit("token");
        }, error => {
          this._tokenRequested = false;
          reject(error);
          this._emitter.emit("error", error);
        });

      }
      else {
        const tokenFunction = () => {
          this._emitter.off("error", errorFunction);
          resolve(this._id_token);
        };

        const errorFunction = (error) => {
          this._emitter.off("token", tokenFunction);
          reject(error);
        }

        // Wait for the pending request
        this._emitter.once("token", tokenFunction);
        this._emitter.once("error", errorFunction);
      }
    });
  }

  _selfSignJwt() {
    const payload = {
      "iss": this._keys.client_email,
      "sub": this._keys.client_email,
      "aud": this._keys.token_uri,
      "target_audience": this._client_id,
      "exp": new Date() / 1000 + 120
    };

    const token = jwt.sign(payload, this._keys.private_key, {
      algorithm: "RS256",
    });

    return token;
  }

  /**
   *  Refreshes the id_token obtaining a new one
   * 
   *  @returns Promise
   * 
   */
  refreshToken() {
    this._id_token = null;

    return this._getNewToken();
  }
}

// Pre-instantiated by default object
const idTokenRetriever = new IdTokenFetch();

export { idTokenRetriever, IdTokenFetch };
