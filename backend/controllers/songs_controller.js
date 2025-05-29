import axios from 'axios';
import User from '../models/users';
import {refreshSpotifyToken} from '../utils/spotify_token.js';

const getSongs = async (req, res) => {
  const userId = req.headers["user-id"];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized request - missing x-user-id header' });
  }

  let user;
  try {
    user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
  } catch (err) {
    return res.status(500).json({ error: 'DB error' });
  }

  const fetchSongs = async (accessToken) => {
    return axios.get('https://api.spotify.com/v1/me/tracks', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { limit: 50, offset: 0 }
    });
  };

  let accessToken = user.spotifyAccessToken;

  try {
    const response = await fetchSongs(accessToken);
    return res.json(response.data);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      // Access token expired - try refreshing
      try {
        console.log('Access token expired - trying to refresh');
        const newTokens = await refreshSpotifyToken(user.spotifyRefreshToken);

        // Save new token in DB
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { access_token: newTokens.access_token},
          { new: true }
        )
        console.log('New access token:', newTokens);

        // Retry with new token
        const retryResponse = await fetchSongs(newTokens.access_token);
        return res.json(retryResponse.data);
      } catch (refreshErr) {
        console.error('Refresh failed:', refreshErr.message);
        return res.status(500).json({ error: 'Token refresh failed' });
      }
    } else {
      console.error('Spotify API error:', err.message);
      return res.status(500).json({ error: 'Spotify API error' });
    }
  }
};



export default { getSongs };