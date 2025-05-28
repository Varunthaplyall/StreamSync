import axios from "axios";

export default {
    getSongs: async (req, res) => {
        try {
            const req = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: {
                    'Authorization':`Bearer BQB2t-RPzi_XzYs5ViFmhW18xGkmwMKhKY3P-2iPHjpt7JFER6EPcDO2avlOC5XFEjRgYMk8IaSvsEWSpZlPnn7Ck1zs34ShyL2QPiA1LM5B3ldd5CtsWP3XldNTkpgSdhyAKfTXg5_3fWQ9iTO2o-31BnNmUQv0WcDvmUnf8OCMpwiT098HNVdLFSe089TdtI3O5d-Rl4OFVdBUkw87tplC4DFiphhyfpubg-DnU2U3F84d_Ry8Vw05OWftc5njg6bL34Z4`
                },
                params:{
                    limit: 50,
                    offset: 0
                }
            })

            // console.log(req.data.items)
            res.status(200).send("hello")
        } catch (error) {
            console.log(error)
        }
    }
}