# MetaMask Authentication Flow

This document outlines how authentication with **MetaMask** works, using **Ethereum signatures** and a **nonce-based challenge-response** system to securely identify users and prevent replay attacks.

---

## Notes

### 1. What is a nonce?

A **nonce** (short for _"number used only once"_) is a randomly generated string used to prevent **replay attacks**. In this flow, it ensures that each login attempt is unique by requiring a fresh cryptographic signature.

---

### 2. What is a replay attack?

A **replay attack** occurs when an attacker intercepts a valid authentication message (like a signature) and reuses it to gain unauthorized access.

> The attacker doesn’t need to decrypt or modify the message — they just resend it.

---

### 3. How does a nonce prevent replay attacks?

Because the server issues a **new and unpredictable nonce** for every login request, previously captured signatures become **useless**. Once a signature is used, the nonce is invalidated and replaced.

---

## Authentication Flow

This system has two main API endpoints:

- `POST /api/auth/nonce` — for requesting a nonce
- `POST /api/auth/login` — for verifying the signed nonce and authenticating the user

---

### 1. `getNonce` Function Flow

This flow kicks off when the frontend needs a nonce from the backend.

#### Step-by-step:

1. **Client Requests Nonce**  
   **[CLIENT] → [SERVER]**  
   POST `/api/auth/nonce` with `{ publicAddress }`.

2. **Server Validates Request**  
   Checks that `publicAddress` is provided.

3. **Check if User Exists**  
   **[SERVER] → [DATABASE]**  
   Find a user with that `publicAddress`.

4. **User Creation (if needed)**

   - If found: use existing user's `nonce`.
   - If not found:  
     **[SERVER] → [DATABASE]**  
     Create a new user with:
     ```json
     {
       "publicAddress": "<address>",
       "nonce": "<randomly-generated>"
     }
     ```

5. **Return Nonce to Client**  
   **[SERVER] → [CLIENT]**  
   Responds with:
   ```json
   {
     "nonce": "<nonce>"
   }
   ```

---

### 2. `login` Function Flow

This is triggered when the user signs the nonce and sends it to the server for verification.

#### Step-by-step:

6. **Client Signs Message**  
   User signs the message:

   ```
   "Sign this nonce: <nonce>"
   ```

   using MetaMask (private key).

7. **Send Signature to Server**  
   **[CLIENT] → [SERVER]**  
   POST `/api/auth/login` with:

   ```json
   {
     "publicAddress": "<address>",
     "signature": "<signature>"
   }
   ```

8. **Server Validates Request**  
   Checks that `publicAddress` and `signature` are present.

9. **Fetch User & Nonce**  
   **[SERVER] → [DATABASE]**  
   Get user by `publicAddress`.

10. **Cryptographic Verification**

- Reconstruct message: `"Sign this nonce: <storedNonce>"`
- Use `ethers.verifyMessage(message, signature)` to get `recoveredAddress`
- Compare `recoveredAddress` with the provided `publicAddress` (case-insensitively)

11. **Generate Session Token & Refresh Nonce**

- Update user with new nonce to prevent reuse.
- Generate a **JWT** with user data:
  ```json
  {
    "id": "<user_id>",
    "publicAddress": "<address>"
  }
  ```

12. **Send Auth Token to Client**  
    **[SERVER] → [CLIENT]**  
    Responds with:

```json
{
  "token": "<JWT>",
  "publicAddress": "<address>"
}
```

The client stores this token to authenticate future requests.

---

## Example Usage

```js
// Example of signing with ethers.js in the browser
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const signature = await signer.signMessage("Sign this nonce: 123456");
```

---

## Create .env in root directory of backend

```js
// The following environment variables should be present
PORT;
DB_URL;
JWT_SECRET;
```
