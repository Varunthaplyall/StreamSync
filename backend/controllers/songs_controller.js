import axios from 'axios';
import User from '../models/users.js';
import Song from '../models/songs.js';
import {refreshSpotifyToken} from '../utils/spotify_token.js';

const getSongs = async (req, res) => {
  const userId = req.headers['user_id'];

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

    const fetchAllSongs = async (accessToken) => {
        let allItems = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
        const response = await axios.get('https://api.spotify.com/v1/me/tracks', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: { limit, offset }
        });

        const items = response.data.items;
        allItems.push(...items);
        offset += limit;

        if (items.length < limit) hasMore = false;  // No more pages
        }

        return allItems;
    };

  let accessToken = user.Token.access_token;

  try {
    const items = await fetchAllSongs(accessToken);
    const songDocs = items.map(({ added_at, track }) => ({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      spotifyTrackId: track.id,
      spotifyUrl: track.external_urls.spotify,
      albumName: track.album.name,
      albumImage: track.album.images?.[0]?.url || '',
      addedAt: added_at,
    }));

    await Song.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, allSongs: songDocs },
      { upsert: true, new: true }
    );

    return res.json({ saved: songDocs.length });

  } catch (err) {
    if (err.response && err.response.status === 401) {
      // Access token expired - try refreshing
      try {
        console.log('Access token expired - trying to refresh');
        const newTokens = await refreshSpotifyToken(user.Token.refresh_token);
        // Save new token in DB
        await User.findOneAndUpdate(
            { _id: user._id },
            { 'Token.access_token': newTokens.access_token },
            { new: true }
        );


        // Retry with new token
        const items = await fetchAllSongs(newTokens.access_token);
        const songDocs = items.map(({ added_at, track }) => ({
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        spotifyTrackId: track.id,
        spotifyUrl: track.external_urls.spotify,
        albumName: track.album.name,
        albumImage: track.album.images?.[0]?.url || '',
        addedAt: added_at,
        }));

        await Song.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, allSongs: songDocs },
        { upsert: true, new: true }
        );

        return res.json({ saved: songDocs.length });
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