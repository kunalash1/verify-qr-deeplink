const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const crypto = require("crypto");

const { BASE_URL, CLIENT_ID } = require("./config");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/*
-------------------------------------------------------
STEP 1 : CREATE VP REQUEST
-------------------------------------------------------
*/
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
                      pattern: "ECACredential"
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

    console.log("VP Request Response:", data);

    const requestId = data.requestId;
    const txnId = data.transactionId;

    const deepLink =
      `openid4vp://authorize?client_id=${CLIENT_ID}` +
      `&request_uri=${BASE_URL}/v1/verify/vp-request/${requestId}`;

    res.json({
      deepLink,
      requestId,
      txnId
    });

  } catch (error) {
    console.error("Generate link error:", error);
    res.status(500).json({ error: "Failed to generate link" });
  }
});


/*
-------------------------------------------------------
STEP 2 : POLL STATUS
-------------------------------------------------------
*/
app.get("/poll-status/:requestId/:txnId", async (req, res) => {

  const { requestId, txnId } = req.params;

  try {

    const statusResponse = await fetch(
      `${BASE_URL}/v1/verify/vp-request/${requestId}/status`
    );

    const statusData = await statusResponse.json();

    console.log("Status API response:", statusData);

    /*
    STOP if QR expired
    */
    if (statusData.status === "EXPIRED") {
      return res.json({
        completed: false,
        status: "EXPIRED"
      });
    }

    /*
    STEP 3 : FETCH VP RESULT
    */
    if (statusData.status === "VP_SUBMITTED") {

      const resultResponse = await fetch(
        `${BASE_URL}/v1/verify/vp-result/${txnId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const resultData = await resultResponse.json();

      console.log("VP Result:", resultData);

      return res.json({
        completed: true,
        result: resultData
      });
    }

    /*
    CONTINUE POLLING
    */
    res.json({
      completed: false,
      status: statusData.status
    });

  } catch (error) {
    console.error("Polling error:", error);
    res.status(500).json({ error: "Polling failed" });
  }
});


/*
-------------------------------------------------------
START SERVER
-------------------------------------------------------
*/
const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});