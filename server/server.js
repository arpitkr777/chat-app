import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { Socket } from "dgram";

// create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server , {
    cors: {origin: "*"}
})

// store online users
export const userSocketMap = {}; // {userId : socketId}

// Socket.io connection handler
io.on("connection" , (Socket)=>{
    const userId = Socket.handshake.query.userId;
    console.log("User Connected" , userId);

    if(userId) userSocketMap[userId] = Socket.id;
    
    // Emit online users to all connected clinents
    io.emit("getOnlineUsers" , Object.keys(userSocketMap));

    Socket.on("disconnect" , ()=>{
        console.log("User Disconnected" , userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers" , Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

// Routes setup
app.use("/api/status" , (req,res)=>res.send("server is live"));
app.use("/api/auth" , userRouter);
app.use("/api/messages" , messageRouter);

//connect to mongodb
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log(`server is running on PORT : ${PORT}`));
