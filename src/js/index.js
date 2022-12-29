import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { webgl, Sketch } from "./webgl";
import { progressLoading } from "./loading";

new progressLoading(
  document.querySelectorAll("#loading"),
  document.querySelector("#log"),
  document.querySelector("#progress")
);

window.addEventListener("load", () => {
  gsap.to("#progress", {
    delay: 0.4,
    duration: 1.2,
    autoAlpha: 0,
  });
  // gsap.to("#log", {
  //   delay: 0.4,
  //   duration: 1.2,
  //   autoAlpha: 0,
  // });
});

gsap.registerPlugin(ScrollTrigger);

let animation = new Sketch({
  dom: document.querySelector(".canvas"),
});

gsap.to(animation.settings, {
  duration: 2.4,
  progress: 1,
  ease: "expo.inOut",
});

const wrapper = document.querySelector(".wrapper");
const borders = document.querySelectorAll(".border");

gsap.to(wrapper, {
  x: "-2500px",
  scrollTrigger: {
    trigger: "#container",
    start: "top top",
    pin: true,
    scrub: 2.4,
    onUpdate: (self) => {
      animation.time = self.progress * 10;
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
