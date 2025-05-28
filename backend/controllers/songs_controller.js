import axios from "axios";

export default {
    getSongs: async (req, res) => {
        try {
            const req = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: {
                    'Authorization':`Bearer ${process.env.SPOTIFY_SECRET_TOKEN}`
                },
                params:{
                    limit: 50,
                    offset: 0
                }
            })

            console.log(req)
            req.status(200).send("hello")
        } catch (error) {
            console.log(error)
        }
    }
}