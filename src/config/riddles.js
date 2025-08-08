export const riddles = [
  {
    path: "1",
    password: "rosa2025",
    videoSrc: "/videos/riddle1.mp4",
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

// Função para buscar charada pelo path
export const getRiddleByPath = (path) => {
  return riddles.find((riddle) => riddle.path === path);
};

// Função para obter próxima charada
export const getNextRiddle = (currentPath) => {
  const currentIndex = riddles.findIndex((riddle) => riddle.path === currentPath);
  if (currentIndex !== -1 && currentIndex < riddles.length - 1) {
    return riddles[currentIndex + 1];
  }
  return null; // Não há próxima charada
};

// Função para verificar se é a última etapa
export const isLastRiddle = (currentPath) => {
  const currentIndex = riddles.findIndex((riddle) => riddle.path === currentPath);
  return currentIndex === riddles.length - 1;
};
