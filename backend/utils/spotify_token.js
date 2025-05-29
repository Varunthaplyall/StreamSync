import Router from "express";
const router = Router();
import axios from "axios";
import querystring from "querystring";
import crypto from "crypto";
import dotenv from "dotenv"
import User from '../models/users.js';

dotenv.config()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const URL = process.env.URL
const REDIRECT_URI = `${URL}/callback`;

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
    
    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
      },
    });

    const spotifyProfile = {
        username: userResponse.data.display_name,
        email: userResponse.data.email,
        countryCode: userResponse.data.country,
        uri: userResponse.data.uri,
        Id: userResponse.data.id,
        Token: {
            access_token,
            refresh_token,
            expires_in,
            scope: tokenResponse.data.scope,
            token_type: tokenResponse.data.token_type,
        }
    };
    // Save or update user in the database
    await User.findOneAndUpdate(
      { Id: spotifyProfile.Id },
      { $set: spotifyProfile },
      { upsert: true, new: true }
    );

    res.json({ Id: spotifyProfile.Id});
    console.log("A user saved to DB");   

  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error("Token exchange failed:", {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
    });
    } else {
    console.error("Unknown error during token exchange:", error);
    }
    res.status(500).json({ error: "Failed to get access token" });
  }
});

export const refreshSpotifyToken = async (refreshToken) => {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const response = await axios.post('https://accounts.spotify.com/api/token', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
  });

  return response.data;
};


export default router;
