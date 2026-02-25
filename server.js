const express = require("express");
// const fetch = require("node-fetch");
const path = require("path");
const { BASE_URL, CLIENT_ID } = require("./config");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.post("/generate-link", async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/v1/verify/vp-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        nonce: Date.now().toString(),
        acceptVPWithoutHolderProof: true,
        presentationDefinition: {
          id: crypto.randomUUID(),
          purpose:
            "Relying party is requesting your digital ID for the purpose of Self-Authentication",
          input_descriptors: [
            {
              id: "id card credential",
              format: {
                ldp_vc: {
                  proof_type: ["Ed25519Signature2020"]
                }
              },
              constraints: {
                fields: [
                  {
                    path: ["$.type"],
                    filter: {
                      type: "object",
                      pattern: "LandStatementCredential"
                    }
                  }
                ]
              }
            }
          ]
        }
      })
    });

    const data = await response.json();

    const deepLink = `openid4vp://authorize?client_id=${CLIENT_ID}&request_uri=${BASE_URL}/v1/verify/vp-request/${data.requestId}`;

    res.json({ deepLink });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something broke" });
  }
});

app.listen(3002, () => {
  console.log("Server running at http://localhost:3002");
});
