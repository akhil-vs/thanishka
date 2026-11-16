export type ExampleModel = {
  id: string;
  name: string;
  image: string;
};

/** Women's full-body / portrait references for try-on without an upload. */
export const EXAMPLE_MODELS: ExampleModel[] = [
  {
    id: "maya",
    name: "Maya",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop",
  },
  {
    id: "aisha",
    name: "Aisha",
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=1000&fit=crop",
  },
  {
    id: "priya",
    name: "Priya",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1000&fit=crop",
  },
  {
    id: "leela",
    name: "Leela",
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop",
  },
];
