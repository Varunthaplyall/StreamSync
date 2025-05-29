import mongoose from 'mongoose';

const SongSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  allSongs: [
    {
      title: String,
      artist: String,
      spotifyTrackId: String,
      spotifyUrl: String,
      albumName: String,
      albumImage: String,
      addedAt: Date,
      youtubeUrl: String
    }
  ]
}, { timestamps: true });

export default mongoose.model('Song', SongSchema);
