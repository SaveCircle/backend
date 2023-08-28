// import { dango } from "https://deno.land/x/dangodb@v1.0.2/mod.ts"

// const userSchema = dango.schema({
//   // A property accepts the below options. Only type is required and must be a valid selection.
//   name: {
//     type: "string", // Valid data types listed below.
//     required: true, // A boolean to indicate if the inserted property must have a value specified. Defaults to false.
//     unique: true, // A boolean to indicate if the inserted property much be unique in its value in the collection. Defaults to false.
//     default: "T-Rex", // A value to default to if none specified and required = false. Defaults to null.
//     validator: null, // A user provided validation function that must return true with the casted value as input for the data to pass schema validation. Defaults to null.
//   },
//   age: "number", // A property can also accept a schema value with only a type indicated.
// })
import { model, Schema } from "npm:mongoose@^6.7"

const userSchema = new Schema({})

export default model("User", userSchema)
