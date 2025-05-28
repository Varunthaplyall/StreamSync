import axios from "axios";

export default {
    getSongs: async (req, res) => {
        try {
            const req = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: {
                    'Authorization':`Bearer BQDI1l9r4jvDaxy3r7ziGelKYDroxrbEPu2u5rnObqt6b6lDrpU-EzcfR6xF7te6CebEZzrH1Ql-QK8RX2NtYHu2Mpvu7XPDYGwXXZkkf0aKTdRzcfZj1StVdn7sa_araezadiIXfqT1Eo3n0249bs3arjLwqKAMW7Z0T6PemMGbw3epkxXkC6xJuSMJnBbK_CcSpyKxldco_dCk32Tu5ahh3WBcD60Q3-FLU95CB-NqxNYvHM-aW8U0MzyWSVJsEOg2xcKG`
                },
                params:{
                    limit: 50,
                    offset: 0
                }
            })

            console.log(req)
            res.status(200).send("hello")
        } catch (error) {
            console.log(error)
        }
    }
}