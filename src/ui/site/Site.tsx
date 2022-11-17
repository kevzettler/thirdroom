import { Scroll } from "../atoms/scroll/Scroll";
import { BlogSection } from "./BlogSection";
import { FooterSection } from "./FooterSection";
import { HeroSection } from "./HeroSection";
import { NavigationBar } from "./NavigationBar";
import "./Site.css";

export default function Site() {
  return (
    <div className="Site flex flex-column">
      <NavigationBar />
      <div className="grow">
        <img
          width="100%"
          height="100%"
          src="/image/crashgiants4.png"
          alt="Crashgiants giant robots smashing into eachother in suburban neighborhoods"
        />
      </div>
    </div>
  );
}
