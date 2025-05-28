import mongoose from "mongoose";

const users = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true }, 
  countryCode: String,
  uri: String,
  Id: { type: String, unique: true },
  Token: {
    access_token: String,
    refresh_token: String,
    expires_in: Number,
    scope: String,
    token_type: String,
  }
},
{ timestamps: true }
);

const Users = mongoose.model("Users", users);

export default Users;