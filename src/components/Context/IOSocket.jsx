"use client";
import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
export const AppContext = createContext();
export default function SocketContextProvider({ children }) {
  const [wsUrl, setWsUrl] = useState("ws://localhost:2608");

  const [isLoaded, setIsloaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState("");

  const [socket, setSocket] = useState(null);

  const [isLive, setIsLive] = useState(false);
  const [message, setMessage] = useState("");
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveInfo, setLiveInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [chats, setChats] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [totalViewers, setTotalViewers] = useState([]);
  const [currentViewers, SetCurrentViewers] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  const [words, setWords] = useState({});
  const [userChats, setUserChats] = useState({});
  const [userGifts, setUserGifts] = useState({});
  const [mostGifts, setMostGifts] = useState({});
  const [userLikes, setUserLikes] = useState({});

  const resetState = () => {
    setIsLive(false);
    setMessage("");
    setIsLiveConnected(false);
    setLiveInfo(null);
    setLogs([]);
    setChats([]);
    setGifts([]);
    setTotalViewers([]);
    SetCurrentViewers(0);
    setWords({});
    setUserChats({});
    setUserGifts({});
    setMostGifts({});
    setUserLikes({});
  };
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) setIsloaded(true);
    if (isLoaded && connected && username) {
      if (socket) {
        socket.on("connect", () => {
          setConnected(true);
          console.log("connected to ay");
        });
        socket.on("data-roomInfo", (data) => {
          data = JSON.parse(data);
          console.log({ liveInfo: data });
          setLiveInfo(data);
        });
        socket.on("data-connection", (data) => {
          data = JSON.parse(data);
          if (data.isCon) {
            setIsLiveConnected(data.isConnected);
            setIsLive(true);
          }

          setIsLoading(false);
        });
        socket.on("data-islive", (data) => {
          data = JSON.parse(data);
          setIsLiveConnected(false);
          setIsLive(false);
          setMessage(data.message);
        });
        socket.on("data-chat", (data) => {
          try {
            data = JSON.parse(data);
            setChats((prev) => [data, ...prev]);
            setLogs((prev) => [{ type: "chat", data }, ...prev]);
            data.comment.split(" ").forEach((word) => {
              if (words[word.toLowerCase()]) {
                words[word.toLowerCase()] = words[word.toLowerCase()] + 1;
              } else {
                words[word.toLowerCase()] = 1;
              }
            });

            if (userChats[data.uniqueId]) {
              userChats[data.uniqueId] = userChats[data.uniqueId] + 1;
            } else {
              userChats[data.uniqueId] = 1;
            }
          } catch (err) {
            console.log(err);
          }
        });
        socket.on("data-gift", (data) => {
          try {
            data = JSON.parse(data);
            setGifts((prev) => [data, ...prev]);
            if (data.giftType === 1 && !data.repeatEnd) {
              setLogs((prev) => [
                { type: "gift", isStreak: true, data },
                ...prev,
              ]);
            } else {
              if (userGifts[data.uniqueId]) {
                userGifts[data.uniqueId] =
                  userGifts[data.uniqueId] + data.repeatCount;
              } else {
                userGifts[data.uniqueId] = data.repeatCount;
              }
              if (mostGifts[data.giftName]) {
                mostGifts[data.giftName] =
                  mostGifts[data.giftName] + data.repeatCount;
              } else {
                mostGifts[data.giftName] = data.repeatCount;
              }
              console.log({ data });
              setLogs((prev) => [
                { type: "gift", isStreak: false, data },
                ...prev,
              ]);
            }
          } catch (err) {}
        });
        socket.on("data-member", (data) => {
          try {
            data = JSON.parse(data);
            if (totalViewers.includes(data.uniqueId)) {
              setLogs((prev) => [
                { type: "viewer", isRejoin: true, data },
                ...prev,
              ]);
            } else {
              setTotalViewers((prev) => [...prev, data]);
              setLogs((prev) => [
                { type: "viewer", isRejoin: false, data },
                ...prev,
              ]);
            }
          } catch (err) {}
        });
        socket.on("data-viewer", (data) => {
          try {
            data = JSON.parse(data);
            SetCurrentViewers(data.viewerCount);
          } catch (err) {}
        });
        socket.on("data-like", (data) => {
          try {
            data = JSON.parse(data);
            setLogs((prev) => [{ type: "like", data }, ...prev]);
            if (userLikes[data.uniqueId]) {
              userLikes[data.uniqueId] += data.likeCount;
            } else {
              userLikes[data.uniqueId] = data.likeCount;
            }
            setTotalLikes(data.totalLikeCount ?? 0);
          } catch (err) {}
        });
      }
    } else {
      console.log("Not connected");
    }
  }, [isLoaded, connected]);
  const initializeSocket = () => {
    if (!username) return;
    if (!socket) {
      localStorage.setItem("socketUrl", wsUrl);
      const s = io(wsUrl, {
        transports: ["websocket"],
        forceNew: false,
      });
      setSocket(s);
      setConnected(true);
      s.emit("listenToUsername", username);
    } else {
      resetState();
      socket.emit("listenToUsername", username);
    }
  };
  return (
    <AppContext.Provider
      value={{
        socket,
        connected,
        chats,
        username,
        isLive,
        setUsername,
        initializeSocket,
        isLoading,
        setIsLoading,
        liveInfo,
        gifts,
        logs,
        totalViewers,
        currentViewers,
        isLiveConnected,
        message,
        setMessage,
        totalLikes,
        words,
        userChats,
        userGifts,
        mostGifts,
        userLikes,
        setWsUrl,
        wsUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
