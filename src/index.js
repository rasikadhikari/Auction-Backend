"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = require("body-parser");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
app.use((0, body_parser_1.json)());
app.use(express_1.default.json());
app.use((0, body_parser_1.urlencoded)({ extended: true }));
mongoose_1.default
    .connect("mongodb://localhost:27017/", { dbName: "Auction" })
    .then(() => {
    console.log("Connected to database ");
    app.listen(4000, () => {
        console.log("App is running !!!");
    });
})
    .catch((err) => {
    console.error("Errror in the port 4000", err);
});
