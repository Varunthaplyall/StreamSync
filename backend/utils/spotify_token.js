import Router from "express";
const router = Router();
import axios from "axios";
import querystring from "querystring";
import crypto from "crypto";
import dotenv from "dotenv"

dotenv.config()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";

// Helper to generate random state string
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Store state temporarily (in-memory or use a store)
let stateKey = "spotify_auth_state";
let appState = null;

// Step 1: Redirect user to Spotify login
router.get("/login", (req, res) => {
  const state = generateRandomString(16);
  appState = state;

  const scope = "user-read-private user-read-email user-library-read";

  const queryParams = querystring.stringify({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  res.redirect("https://accounts.spotify.com/authorize?" + queryParams);
});

// Step 2: Callback - Spotify redirects user here with authorization code
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null || state !== appState) {
    return res.redirect(
      "/?" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // You can now use `access_token` to access /v1/me or /v1/me/tracks
    // Ideally: store token in session or DB
    res.json({ access_token, refresh_token, expires_in });
  } catch (error) {
    console.error("Token exchange failed:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

export default router;
