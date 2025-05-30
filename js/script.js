/* Utils */
function lerp(a, b, t) {
      return a + (b - a) * t;
}

function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spring(mass, stiffness, velocity, damping) {
      let duration;

      const w0 = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));
      const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
      const a = 1;
      const b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

      function solver(t) {
            let progress = duration ? (duration * t) / 1000 : t;
            if (zeta < 1) {
                  progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
            } else {
                  progress = (a + b * progress) * Math.exp(-progress * w0);
            }
            if (t === 0 || t === 1) return t;
            return 1 - progress;
      }

      function getDuration() {
            const frame = 1 / 6;
            let elapsed = 0;
            let rest = 0;
            while (true) {
                  elapsed += frame;
                  if (solver(elapsed) === 1) {
                        rest++;
                        if (rest >= 16) break;
                  } else {
                        rest = 0;
                  }
            }
            const duration = elapsed * frame * 1000;
            return duration;
      }

      if (!duration) duration = getDuration();

      return { duration, solver };
}

function interpolate(params = { onUpdate, onStop, duration: 1000, easing }) {
      const start = performance.now();
      let rafId = null;
      let destroyed = false;
      let ease = params.easing ?? ((t) => t);

      function frame(now) {
            if (destroyed) return;

            let t = (now - start) / params.duration;
            if (t > 1) t = 1;

            params.onUpdate(ease(t));

            if (t < 1) {
                  rafId = requestAnimationFrame(frame);
            } else if (params.onStop) {
                  params.onStop();
                  if (rafId !== null) cancelAnimationFrame(rafId);
            }
      }

      rafId = requestAnimationFrame(frame);

      return {
            destroy() {
                  destroyed = true;

                  if (rafId !== null) cancelAnimationFrame(rafId);
            },
      };
}

function debounce(func, timeout = 300) {
      let timer;
      return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                  func.apply(this, args);
            }, timeout);
      };
}
/* Screen Size */
function handleUnsupportedScreen() {
      const pleasureText = "Im so sorry but....🥀 <br>.<br>.<br>.<br>.<br>.<br>.<br>.<br>.<br>.<br>.<br>.<br> YOUR SCREEN IS TOO SMALL LIL BRO GO GET NEW DEVICE!! 😭🥀🥀";

      if (window.innerWidth <= 300) {
            document.body.innerHTML = `
            <main>
              <section class="hero">
                <h1 class="title">${pleasureText}</h1>
              </section>
            </main>
            `;
      }
}

/* Card Animation */

function handleCardAnimation() {
      // constants
      const translationOffset = 200;
      const rotationOffset = -15;
      const scaleOffset = -0.2;
      const opacityOffset = -0.5;

      const easeOutExpo = (x) => {
            return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      };

      const duration = 800;

      // elements
      const cards = document.querySelectorAll("main #hero .card-container .card");
      const dots = document.querySelectorAll("main #hero .card-container .dots .dot");
      const bgBlur = document.querySelectorAll("main #hero .background-blur img");
      const swipeTracker = document.querySelector("main #hero .card-container .swipe-tracker");

      // variables
      let currentBlur = 1;
      let prevCard = 0;
      let currentCard = 1;

      (function init() {
            if (window.innerWidth < 900) {
                  bindScrollToTracker();
            } else {
                  cards.forEach((card) => {
                        const debouncedSelectCard = debounce(selectCard, 100);

                        cards.forEach((card) => {
                              card.onclick = () => debouncedSelectCard(card);
                        });
                  });

                  moveDot(prevCard, currentCard);
            }

            // Animate card at first
            animateCard(true);
      })();

      function bindScrollToTracker() {
            cards.forEach(() => swipeTracker.appendChild(document.createElement("div")));

            swipeTracker.scrollTo({ left: swipeTracker.children[currentCard].offsetLeft });

            swipeTracker.addEventListener("scroll", (e) => {
                  requestAnimationFrame(() => {
                        for (let i = 0; i < e.target.children.length; i++) {
                              const cardTracker = e.target.children[i];
                              const rect = cardTracker.getBoundingClientRect();
                              const factor = rect.x / rect.width;

                              const card = cards[i];

                              const to = {
                                    translate: translationOffset * factor,
                                    scale: 1 + scaleOffset * Math.abs(factor),
                                    rotate: rotationOffset * factor,
                                    opacity: 1 + opacityOffset * Math.abs(factor),
                              };

                              card.style.transform = `translateX(${to.translate}px) rotateY(${to.rotate}deg) scale(${to.scale})`;

                              card.style.opacity = to.opacity;

                              card.style.zIndex = cards.length - Math.round(Math.abs(factor));

                              let progress = 1 - Math.min(Math.abs(factor), 1);
                              interpolateDot(progress, i);

                              if (Math.abs(factor) < 0.0001) {
                                    currentCard = i;
                                    changeBackgroundBlur();
                              }
                        }
                  });
            });

            let holdTimeout;

            swipeTracker.addEventListener("touchstart", (e) => {
                  holdTimeout = setTimeout(() => {
                        cards[currentCard].classList.add("animate");
                  }, 500);
            });

            swipeTracker.addEventListener("touchend", () => {
                  cards[currentCard].classList.remove("animate");
                  clearTimeout(holdTimeout);
            });

            swipeTracker.addEventListener("touchmove", () => {
                  cards[currentCard].classList.remove("animate");
                  clearTimeout(holdTimeout);
            });
      }

      async function interpolateDot(progress, index) {
            dots[index].style.opacity = 0.5 + 0.5 * progress;
            dots[index].style.scale = 1.0 + 0.4 * progress;
      }

      function selectCard(card) {
            const cardsArray = Array.from(cards);

            prevCard = currentCard;
            currentCard = cardsArray.findIndex((c) => c === card);

            moveDot(prevCard, currentCard);
            animateCard();
      }

      function animateCard(firsttime = false) {
            prepareCardAnimation(currentCard, firsttime);

            interpolate({
                  onUpdate: (progress) => {
                        for (let i = 0; i < cards.length; i++) {
                              const card = cards[i];

                              const curr = {
                                    translate: lerp(card._from.translate, card._to.translate, progress),
                                    scale: lerp(card._from.scale, card._to.scale, progress),
                                    rotate: lerp(card._from.rotate, card._to.rotate, progress),
                                    opacity: lerp(card._from.opacity, card._to.opacity, progress),
                              };

                              card.style.transform = `translateX(${curr.translate}px) rotateY(${curr.rotate}deg) scale(${curr.scale})`;
                              card.style.opacity = curr.opacity;

                              card._prev = curr;
                        }
                  },

                  duration,
                  easing: easeOutExpo,
            });

            changeBackgroundBlur();
      }

      function prepareCardAnimation(index, firsttime = false) {
            for (let i = 0; i < cards.length; i++) {
                  const card = cards[i];
                  const factor = i - index;

                  card._from = card._prev;

                  if (firsttime) {
                        card._from = {
                              translate: 0,
                              scale: 1,
                              rotate: 0,
                              opacity: 1,
                        };
                  }

                  card._to = {
                        translate: translationOffset * factor,
                        scale: 1 + scaleOffset * Math.abs(factor),
                        rotate: rotationOffset * factor,
                        opacity: 1 + opacityOffset * Math.abs(factor),
                  };

                  card.style.zIndex = cards.length - Math.abs(factor);
            }
      }

      function changeBackgroundBlur() {
            const newBlur = 1 - currentBlur;

            bgBlur[newBlur].src = cards[currentCard].children[0].src;

            bgBlur[currentBlur].style.opacity = 0;
            bgBlur[newBlur].style.opacity = 0.2;

            currentBlur = newBlur;
      }

      function moveDot(prev, current) {
            dots[current].classList.add("active");
            dots[prev].classList.remove("active");
      }
}

/* Cta-Button */
function handleCtaButton() {
      document.querySelector("main #hero .cta-button").onclick = () => {
            for (const section of Array.from(document.querySelector("main").children)) if (section.className !== "hero") section.style.display = section.dataset.display;

            const about = document.querySelector("main #about");
            window.scrollTo({ top: about.offsetTop, behavior: "smooth" });
      };
}

/* Gallery */
function handleGallery() {
      // constants
      const folderPath = "./assets/gallery/";
      const total = 40;
      const easing = {
            open: spring(0.5, 20, 0, 5),
            close: spring(0.3, 18, 0, 10),
      };

      // elements
      const gallery = document.querySelector("main #gallery .container");
      const lightboxContainer = document.querySelector("main #gallery .lightbox-container");
      const lightbox = lightboxContainer.children[0];

      // variables
      let opennedPhoto;
      let animation;
      let currentInterpolationValues = {};

      (function init() {
            const observer = new IntersectionObserver(
                  (entries, observer) => {
                        entries.forEach((entry) => {
                              if (entry.isIntersecting) {
                                    const box = entry.target;
                                    if (box.firstChild) {
                                          box.classList.add("loaded");
                                          return;
                                    }

                                    const newImg = document.createElement("img");

                                    newImg.src = box.dataset.imgSrc;
                                    newImg.alt = box.dataset.imgAlt;
                                    newImg.loading = "lazy";

                                    box.appendChild(newImg);

                                    const showImg = async () => {
                                          await sleep(200);
                                          box.classList.add("loaded");

                                          // stop observing dis box bruh
                                          // observer.unobserve(box);
                                    };

                                    if (newImg.complete && newImg.naturalWidth !== 0) {
                                          showImg();
                                    } else {
                                          newImg.onload = showImg;
                                    }
                              } else {
                                    const box = entry.target;

                                    box.classList.remove("loaded");
                              }
                        });
                  },
                  { threshold: 0 }
            );

            for (let i = 1; i <= total; i++) loadImage(i, observer);

            // wrapped with debounce to avoid hella rapid fire
            gallery.addEventListener("click", debounce(viewPhoto, 100));

            lightboxContainer.addEventListener("click", debounce(closePhoto, 100));

            document.addEventListener(
                  "keydown",
                  debounce((e) => {
                        if (e.key === "Escape" && opennedPhoto) closePhoto();
                  }, 100)
            );
      })();

      async function loadImage(index, observer) {
            const heightFactor = window.innerHeight / 1080;
            const box = document.createElement("div");

            box.className = "box";
            box.dataset.imgSrc = `${folderPath}img-${index}.jpeg`;
            box.dataset.imgAlt = `Gallery image ${index}`;
            box.style.height = `${getRandomInt(100, 400 * heightFactor)}px`;

            observer.observe(box);

            gallery.appendChild(box);

            await new Promise((res) => requestIdleCallback(res));
            // less wait between img load calls
      }

      async function interpolateLightbox(from, to, t) {
            const curr = {
                  top: lerp(from.top, to.top, t),
                  left: lerp(from.left, to.left, t),
                  width: lerp(from.width, to.width, t),
                  height: lerp(from.height, to.height, t),
                  rotateY: lerp(from.rotateY, to.rotateY, t),
                  opacity: lerp(from.opacity, to.opacity, t),
            };

            lightbox.style.cssText = `
                  top: ${curr.top}px;
                  left: ${curr.left}px;
                  width: ${curr.width}px;
                  height: ${curr.height}px;
                  transform: translateZ(0) rotateY(${curr.rotateY}deg);
            `;

            lightboxContainer.style.background = `rgba(0, 0, 0, ${curr.opacity})`;

            currentInterpolationValues = curr;
      }

      async function viewPhoto(gallery) {
            const photo = gallery.target;
            const img = photo.firstChild;

            const { top, left, width: w, height: h } = photo.getBoundingClientRect();
            const aspect = img.naturalWidth / img.naturalHeight;

            // preload img
            lightbox.children[0].src = img.src;
            if (!img.complete) await new Promise((res) => (img.onload = res));

            Object.assign(lightbox.style, {
                  top: `${top}px`,
                  left: `${left}px`,
                  width: `${w}px`,
                  height: `${h}px`,
            });

            opennedPhoto = photo;

            lightboxContainer.classList.add("visible");
            document.body.classList.add("no-scroll");
            img.style.visibility = "hidden";
            document.querySelector("nav").style.transform = "translateY(-99px)";

            requestAnimationFrame(() => {
                  const from = {
                        opacity: 0,
                        top: top,
                        left: left,
                        width: w,
                        height: h,
                        rotateY: 0,
                  };

                  const finalWidth = window.innerWidth > 600 ? 600 : window.innerWidth;
                  const finalHeight = finalWidth / aspect;
                  const to = {
                        width: finalWidth,
                        height: finalHeight,
                        top: window.innerHeight / 2 - finalHeight / 2,
                        left: window.innerWidth / 2 - finalWidth / 2,
                        opacity: 1,
                        rotateY: 360,
                  };

                  // wait next paint so styles apply b4 anim

                  animation?.destroy();
                  animation = interpolate({
                        onUpdate: (progress) => interpolateLightbox(from, to, progress),
                        duration: easing.open.duration,
                        easing: easing.open.solver,
                  });
            });
      }

      async function closePhoto() {
            const photo = opennedPhoto;

            if (!photo) return;

            const img = photo.firstChild;
            const { top, left, width: w, height: h } = photo.getBoundingClientRect();
            const from = currentInterpolationValues;
            const to = {
                  opacity: 0,
                  top: top,
                  left: left,
                  width: w,
                  height: h,
                  rotateY: 0,
            };

            // First, shrink the lightbox and hide it
            animation?.destroy();

            document.querySelector("nav").style.transform = "translateY(0px)";

            animation = interpolate({
                  onUpdate: (progress) => interpolateLightbox(from, to, progress),
                  onStop: () => {
                        img.style.visibility = "visible";
                        lightboxContainer.classList.remove("visible");
                        document.body.classList.remove("no-scroll");
                        opennedPhoto = null;
                  },
                  duration: easing.close.duration,
                  easing: easing.close.solver,
            });
      }
}

function handleWebScroll(main, navLinks) {
      const video = document.querySelector("main #about .media-container video");
      const music = (function playSong() {
            const audio = new Audio();
            audio.src = "./assets/lofi-song(When I Was A Boy).mp3";
            audio.type = "audio/mp3";

            audio.addEventListener("error", function () {
                  audio.src = "./assets/lofi-song(When I Was A Boy).mp3";
                  audio.type = "audio/mp3";
            });

            audio.loop = true;
            audio.autoplay = true;

            audio.play().catch((error) => {
                  console.log("Error playing the song:", error);
            });

            return audio;
      })();

      function onVideo() {
            debounce(() => {
                  // Pause the music if it's playing
                  if (!music.paused) {
                        music.pause();
                  }
                  // Play the video if it's not playing
                  if (video.paused) {
                        video.play().catch((error) => {
                              console.log("Error playing the video:", error);
                        });
                  }
            }, 200)();
      }

      function onNotVideo() {
            debounce(() => {
                  video.currentTime = 0; // Reset video to start
                  // Play the music if it's not playing
                  if (music.paused) {
                        music.play().catch((error) => {
                              console.log("Error playing the music:", error);
                        });
                  }
                  // Pause the video if it's playing
                  if (!video.paused) {
                        video.pause();
                  }
            }, 400)();
      }

      const sections = main.children;

      window.onscroll = () => {
            let top = window.scrollY;

            for (const sec of sections) {
                  let offset = sec.offsetTop - 100;
                  let height = sec.offsetHeight;

                  document.body.classList.toggle("scrolled", top > 100);

                  if (top >= offset && top < offset + height) {
                        if (sec.id === "about") onVideo();
                        else onNotVideo();

                        // Set active nav link
                        for (const link of navLinks) {
                              link.classList.remove("active");
                        }

                        const activeLink = document.querySelector(`nav ul li a[href*=${sec.id}]`);
                        if (activeLink) activeLink.classList.add("active");
                  }
            }
      };
}

/* First Landing */
(function onFirstLanding() {
      // Hide all sections except hero on first landing
      const main = document.querySelector("main");
      const navLinks = document.querySelectorAll("nav ul li a");

      const about = document.querySelector(`nav ul li a[href*="about"]`);

      about.onclick = () => {
            for (const section of Array.from(document.querySelector("main").children)) if (section.className !== "hero") section.style.display = section.dataset.display;
      };

      // Ignore if height more biggah
      if (window.innerWidth < 900 && window.innerWidth < window.innerHeight) {
            // Hide others on landind page
            for (const section of Array.from(main.children))
                  if (section.id !== "hero") {
                        // store previous value to dataset first
                        section.dataset.display = section.style.display || "";
                        section.style.display = "none";
                  }
      }

      // Handlers
      handleWebScroll(main, navLinks);
      handleUnsupportedScreen();
      handleCardAnimation();
      handleCtaButton();
      handleGallery();
})();
