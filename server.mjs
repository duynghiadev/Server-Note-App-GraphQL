import express from "express";
import http from "http";
import bodyParser from "body-parser";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import mongoose from "mongoose";
import fakeData from "./fakeData/index.js";
import "dotenv/config";

const app = express();
const httpServer = http.createServer(app);

const typeDefs = `#graphql 
  type Folder {
    id: String,
    name: String,
    createdAt: String,
    author: Author
    notes: [Note]
  }

  type Note {
    id: String,
    content: String
  }

  type Author {
    id: String,
    name: String
  }

  type Query {
    folders: [Folder],
    folder(folderId: String): Folder,
    note(noteId: String): Note
  }`;

const resolvers = {
  Query: {
    folders: () => {
      return fakeData.folders;
    },
    folder: (parent, args) => {
      const folderId = args.folderId;
      console.log({ folderId });
      return fakeData.folders.find((folder) => folder.id === folderId);
    },
    note: (parent, args) => {
      const noteId = args.noteId;
      return fakeData.notes.find((note) => note.id === noteId);
    },
  },
  Folder: {
    author: (parent, args) => {
      console.log({ parent, args });
      const authorId = parent.authorId;
      return fakeData.authors.find((author) => author.id === authorId);
    },
    notes: (parent, args) => {
      console.log({ parent });
      return fakeData.notes.filter((note) => note.folderId === parent.id);
    },
  },
};

// connect Database
const URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.tksacev.mongodb.net/?retryWrites=true&w=majority`;
const PORT = process.env.PORT || 4000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(cors(), bodyParser.json(), expressMiddleware(server));

mongoose.set("strictQuery", false);
mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to DB");

    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log("🚀 Server ready at http://localhost:4000");
  });
