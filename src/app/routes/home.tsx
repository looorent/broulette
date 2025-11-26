import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BiteRoulette" },
    { name: "description", content: "Find a random restaurant near you!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
