// src/config/riddles.js
import video1 from "../assets/videos/video-teste-riddle-01.mp4";

export const riddles = [
  {
    path: "1",
    password: "12/08/2025",
    videoSrc: video1,
    clue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod."
  },
  {
    path: "2",
    password: "rosa2025",
    videoSrc: "/videos/riddle2.mp4",
    clue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod."
  },
  {
    path: "3",
    password: "rosa2025",
    videoSrc: "/videos/riddle3.mp4",
    clue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod."
  },
  {
    path: "4",
    password: "rosa2025",
    videoSrc: "/videos/riddle4.mp4",
    clue: null,
    message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Parabéns!"
  }
];

export const getRiddleByPath = (path) => riddles.find((r) => r.path === String(path));

export const getNextRiddle = (currentPath) => {
  const idx = riddles.findIndex((r) => r.path === String(currentPath));
  return idx !== -1 && idx < riddles.length - 1 ? riddles[idx + 1] : null;
};

export const isLastRiddle = (currentPath) => {
  const idx = riddles.findIndex((r) => r.path === String(currentPath));
  return idx === riddles.length - 1;
};
