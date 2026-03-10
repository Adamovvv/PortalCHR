import { EventsPage } from "./EventsPage";
import type { PortalNews } from "../types";

type HomePageProps = {
  news: PortalNews[];
  username: string;
};

export function HomePage({ news }: HomePageProps) {
  return <EventsPage events={news} />;
}
