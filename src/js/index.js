import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { webgl, Sketch } from "./webgl";
import { progressLoading } from "./loading";

new progressLoading(
  document.querySelectorAll("#loading"),
  document.querySelector("#log"),
  document.querySelector("#progress")
);

gsap.registerPlugin(ScrollTrigger);

let animation = new Sketch({
  dom: document.querySelector(".canvas"),
});

const wrapper = document.querySelector(".wrapper");
const borders = document.querySelectorAll(".border");

gsap.set(wrapper, {
  xPercent: 100,
});
const tl = gsap.timeline();
tl.to(animation.settings, {
  delay: 1.5,
  duration: 2.4,
  progress: 1,
  ease: "expo.inOut",
}).to(
  wrapper,
  {
    xPercent: 50,
    duration: 1.2,
    delay: 0.2,
  },
);

gsap.to(wrapper, {
  x: "-3500px",
  scrollTrigger: {
    // delay: 0.5,
    trigger: "#container",
    start: "top top",
    end: "+=3000",
    pin: true,
    scrub: 1,
    // markers: 1,
    onUpdate: (self) => {
      animation.time = self.progress * 25;
    },
    onLeave: () => {
      borders.forEach((border) => {
        border.classList.add("scrolled");
      });
    },
    onEnterBack: () => {
      borders.forEach((border) => {
        border.classList.remove("scrolled");
      });
    },
    onLeaveBack: () => {
      borders.forEach((border) => {
        border.classList.remove("scrolled");
      });
    },
  },
});
