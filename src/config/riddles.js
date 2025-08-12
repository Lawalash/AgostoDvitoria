// src/config/riddles.js
import video1 from "../assets/videos/20250811-233246_RMT9y4rG.mp4";
import video2 from "../assets/videos/video-shirlene.mp4";
// TODOS os riddles usam o mesmo arquivo de vídeo local (video-teste-riddle-01.mp4).
// Certifique-se de que o arquivo existe em src/assets/videos/.

export const riddles = [
  {
    path: "1",
    password: "12/08/2025",
    videoSrc: video1,
    message: "onde tudo começou, da ideia à realização",
    clue: "Na cesta guarda seu próximo passo."
  },
  {
    path: "2",
    password: "16/10/1978",
    videoSrc: video2,
    message: "Sua família — seu bem mais precioso, sempre ao seu lado.",
    clue: "Se encontre com quem te deu a luz, quem te apoia e te guarda em orações."
  },
  {
    path: "3",
    password: "Familia2025",
    videoSrc: video2,
    message: "Aquele que nasceu e te trouxe alegria — um recomeço que iluminou várias vidas.",
    clue: "Vá até o lugar onde seu sonho se iniciou... onde Deus te concedeu espaço e tranquilidade."
  },
  {
    path: "4",
    password: "24/07/2025",
    videoSrc: video2,
    message: "Amizade não se mede pelo tempo, mas pelas ações — de um simples parabéns a um momento inesquecível.",
    clue: "Adentre seu lar, aproveite — saiba que te amamos muito; cada detalhe foi pensado para te ver feliz."
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
