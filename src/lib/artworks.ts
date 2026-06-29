export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  period: string;
  medium: string;
  museum: string;
  imageUrl: string;
}

export const ARTWORKS: Artwork[] = [
  {
    id: "birth-of-venus",
    title: "The Birth of Venus",
    artist: "Sandro Botticelli",
    year: "c. 1485",
    period: "Early Renaissance",
    medium: "Tempera on canvas",
    museum: "Uffizi Gallery, Florence",
    imageUrl: "/artworks/birth-of-venus.jpg",
  },
  {
    id: "mona-lisa",
    title: "Mona Lisa",
    artist: "Leonardo da Vinci",
    year: "c. 1503–1519",
    period: "High Renaissance",
    medium: "Oil on poplar panel",
    museum: "Louvre Museum, Paris",
    imageUrl: "/artworks/mona-lisa.jpg",
  },
  {
    id: "the-night-watch",
    title: "The Night Watch",
    artist: "Rembrandt van Rijn",
    year: "1642",
    period: "Dutch Golden Age",
    medium: "Oil on canvas",
    museum: "Rijksmuseum, Amsterdam",
    imageUrl: "/artworks/night-watch.jpg",
  },
  {
    id: "girl-with-a-pearl-earring",
    title: "Girl with a Pearl Earring",
    artist: "Johannes Vermeer",
    year: "c. 1665",
    period: "Dutch Golden Age",
    medium: "Oil on canvas",
    museum: "Mauritshuis, The Hague",
    imageUrl: "/artworks/girl-pearl.jpg",
  },
  {
    id: "the-great-wave",
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    year: "c. 1831",
    period: "Edo Period",
    medium: "Woodblock print",
    museum: "Metropolitan Museum of Art, New York",
    imageUrl: "/artworks/great-wave.jpg",
  },
  {
    id: "liberty-leading",
    title: "Liberty Leading the People",
    artist: "Eugène Delacroix",
    year: "1830",
    period: "Romanticism",
    medium: "Oil on canvas",
    museum: "Louvre Museum, Paris",
    imageUrl: "/artworks/liberty-leading.jpg",
  },
  {
    id: "the-scream",
    title: "The Scream",
    artist: "Edvard Munch",
    year: "1893",
    period: "Expressionism",
    medium: "Oil, tempera, pastel on cardboard",
    museum: "National Museum, Oslo",
    imageUrl: "/artworks/the-scream.jpg",
  },
  {
    id: "creation-of-adam",
    title: "The Creation of Adam",
    artist: "Michelangelo Buonarroti",
    year: "c. 1512",
    period: "High Renaissance",
    medium: "Fresco",
    museum: "Sistine Chapel, Vatican City",
    imageUrl: "/artworks/creation-of-adam.jpg",
  },
  {
    id: "starry-night",
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    year: "1889",
    period: "Post-Impressionism",
    medium: "Oil on canvas",
    museum: "Museum of Modern Art, New York",
    imageUrl: "/artworks/starry-night.jpg",
  },
];
