import { type FormEvent, useEffect, useState } from "react";
import { Button, Input, TextArea } from "tamagui";
import bathroom1Image from "./images/bathroom1.avif";
import bathroom2Image from "./images/bathroom2.avif";
import bathroom3Image from "./images/bathroom3.avif";
import bedroom1Image from "./images/bedroom1.avif";
import bedroom2Image from "./images/bedroom2.avif";
import bedroom3Image from "./images/bedroom3.avif";
import bedroom4Image from "./images/bedroom4.avif";
import exteriorImage from "./images/exterior.jpg";
import exterior2Image from "./images/exterior2.avif";
import gameroom1Image from "./images/gameroom1.avif";
import gameroom2Image from "./images/gamerrom2.avif";
import gameroom3Image from "./images/gameroom3.avif";
import garageImage from "./images/garage.avif";
import kitchen1Image from "./images/kitchen1.avif";
import kitchen2Image from "./images/kitchen2.avif";
import laundryImage from "./images/laundry.avif";
import sunroom1Image from "./images/sunroom1.avif";
import sunroom2Image from "./images/sunroom2.avif";
import sunroom3Image from "./images/sunrrom3.avif";

const media = {
  hero: exteriorImage,
};

const navItems = [
  { label: "Stay", href: "#stay" },
  { label: "Gallery", href: "#gallery" },
  { label: "Enquiry", href: "#enquiry" },
  { label: "Address", href: "#address" },
];

const gallerySections = [
  {
    title: "Exterior",
    copy: "Arrival views and outdoor first impressions.",
    images: [
      {
        image: exteriorImage,
        title: "Front Exterior",
        alt: "Front exterior of the Vintage Vineyard Estate home",
      },
      {
        image: exterior2Image,
        title: "Exterior View",
        alt: "Second exterior view of the Vintage Vineyard Estate home",
      },
    ],
  },
  {
    title: "Bedrooms",
    copy: "Prepared sleeping spaces for a clean, restful stay.",
    images: [
      {
        image: bedroom1Image,
        title: "Bedroom One",
        alt: "Bedroom one at Vintage Vineyard Estate",
      },
      {
        image: bedroom2Image,
        title: "Bedroom Two",
        alt: "Bedroom two at Vintage Vineyard Estate",
      },
      {
        image: bedroom3Image,
        title: "Bedroom Three",
        alt: "Bedroom three at Vintage Vineyard Estate",
      },
      {
        image: bedroom4Image,
        title: "Bedroom Four",
        alt: "Bedroom four at Vintage Vineyard Estate",
      },
    ],
  },
  {
    title: "Bathrooms",
    copy: "Bright bathroom spaces with the essentials ready.",
    images: [
      {
        image: bathroom1Image,
        title: "Bathroom One",
        alt: "Bathroom one at Vintage Vineyard Estate",
      },
      {
        image: bathroom2Image,
        title: "Bathroom Two",
        alt: "Bathroom two at Vintage Vineyard Estate",
      },
      {
        image: bathroom3Image,
        title: "Bathroom Three",
        alt: "Bathroom three at Vintage Vineyard Estate",
      },
    ],
  },
  {
    title: "Kitchen",
    copy: "Cooking, dining, and gathering areas for everyday meals.",
    images: [
      {
        image: kitchen1Image,
        title: "Kitchen",
        alt: "Kitchen at Vintage Vineyard Estate",
      },
      {
        image: kitchen2Image,
        title: "Kitchen Dining",
        alt: "Second kitchen view at Vintage Vineyard Estate",
      },
    ],
  },
  {
    title: "Sunroom",
    copy: "A relaxed light-filled room for quiet mornings and conversation.",
    images: [
      {
        image: sunroom1Image,
        title: "Sunroom",
        alt: "Sunroom one at Vintage Vineyard Estate",
      },
      {
        image: sunroom2Image,
        title: "Sunroom",
        alt: "Sunroom two at Vintage Vineyard Estate",
      },
      {
        image: sunroom3Image,
        title: "Sunroom",
        alt: "Sunroom three at Vintage Vineyard Estate",
      },
    ],
  },
  {
    title: "Game Room",
    copy: "A casual space for downtime, games, and hanging out.",
    images: [
      {
        image: gameroom1Image,
        title: "Game Room",
        alt: "Game room one at Vintage Vineyard Estate",
      },
      {
        image: gameroom2Image,
        title: "Game Room",
        alt: "Game room two at Vintage Vineyard Estate",
      },
      {
        image: gameroom3Image,
        title: "Game Room",
        alt: "Game room three at Vintage Vineyard Estate",
      },
    ],
  },
  {
    title: "Laundry & Garage",
    copy: "Practical laundry and garage spaces for everyday needs.",
    images: [
      {
        image: laundryImage,
        title: "Laundry",
        alt: "Laundry area at Vintage Vineyard Estate",
      },
      {
        image: garageImage,
        title: "Garage",
        alt: "Garage at Vintage Vineyard Estate",
      },
    ],
  },
];

type GalleryImage = {
  image: string;
  title: string;
  alt: string;
};

const enquiryEndpoints = import.meta.env.DEV
  ? ["/api/enquiries"]
  : ["/api/enquiries", "/.netlify/functions/enquiries"];
const savedButEmailFailedMessage =
  "Enquiry was saved, but the admin email could not be sent.";

type EnquiryPayload = {
  name: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  message: FormDataEntryValue | null;
  company: FormDataEntryValue | null;
};

async function submitEnquiry(payload: EnquiryPayload) {
  let lastError: unknown;

  for (const endpoint of enquiryEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok) {
        if (result.error === savedButEmailFailedMessage) {
          return result;
        }
        throw new Error(result.error ?? "Unable to save enquiry.");
      }

      return result;
    } catch (error) {
      lastError = error;
      if (!(error instanceof TypeError) && !(error instanceof SyntaxError)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to save enquiry right now.");
}

function Header({ onGalleryOpen }: { onGalleryOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled || open ? "is-scrolled" : ""}`}>
      <a className="brand" href="#top" aria-label="Vintage Airbnb home">
        <span>Vintage</span>
        <small>Vineyard Estate</small>
      </a>

      <button
        className="nav-toggle"
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>

      <nav className={`site-nav ${open ? "is-open" : ""}`}>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(event) => {
              setOpen(false);
              if (item.href === "#gallery") {
                event.preventDefault();
                onGalleryOpen();
              }
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function App() {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [enquiryMessage, setEnquiryMessage] = useState("");

  useEffect(() => {
    document.body.classList.toggle("gallery-modal-open", galleryOpen);
    return () => document.body.classList.remove("gallery-modal-open");
  }, [galleryOpen]);

  useEffect(() => {
    if (!galleryOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGalleryOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [galleryOpen]);

  const handleEnquirySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setEnquiryStatus("saving");
    setEnquiryMessage("");

    try {
      await submitEnquiry({
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
        company: formData.get("company"),
      });

      form.reset();
      setEnquiryStatus("success");
      setEnquiryMessage(
        "Thank You! We have received your details and will connect with you shortly.",
      );
    } catch (error) {
      setEnquiryStatus("error");
      setEnquiryMessage(
        error instanceof TypeError
          ? "Unable to connect right now. Please try again in a moment."
          : error instanceof Error
            ? error.message
            : "Unable to save enquiry right now.",
      );
    }
  };

  return (
    <>
      <style>{pageStyles}</style>
      <Header onGalleryOpen={() => setGalleryOpen(true)} />
      <main id="top">
        <section className="hero" aria-label="Vintage Airbnb Stay">
          <picture>
            <source media="(max-width: 720px)" srcSet={media.hero} />
            <img
              src={media.hero}
              alt="Warm modern home exterior prepared for an Airbnb stay"
            />
          </picture>
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Vintage Vineyard Estate</h1>
            <p>
              A calm, furnished home for weekend escapes, family visits, and
              longer stays. Send an enquiry with your dates and we will reply
              with availability and next steps.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#enquiry">
                Send Enquiry
              </a>
            </div>
          </div>
          <div className="hero-card" aria-label="Airbnb highlights">
            <span>Sunroom Retreat</span>
            <span>Game Room</span>
            <span>Vineyard View</span>
          </div>
        </section>

        <section className="intro section-band" id="stay">
          <p className="section-kicker">The Stay</p>
          <div className="intro-grid">
            <h2>Simple, comfortable, and ready before you arrive.</h2>
            <div className="intro-copy">
              <p>
                Nestled on 5+ acres of vineyard property in Oakley, California,
                this peaceful getaway pairs wine-country charm with modern
                comforts. Enjoy open skies, scenic vineyard views, and plenty of
                room to relax with family, friends, or colleagues.
              </p>
              <p>
                Sip morning coffee overlooking the vines, take a quiet stroll
                through the property, or unwind in comfortable living spaces
                prepared for easy arrivals and restful evenings.
              </p>
              <div className="property-highlights" aria-label="Property highlights">
                {[
                  "5+ acre private vineyard setting",
                  "Spacious home for families and groups",
                  "Fully equipped kitchen",
                  "Fast Wi-Fi",
                  "Ample on-site parking",
                  "Outdoor spaces for relaxing and gathering",
                  "Close to wineries, parks, shopping, and dining",
                  "Easy BART access for Bay Area travel",
                ].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="amenities" aria-label="Amenities">
          {[
            "Entire home access",
            "Self check-in",
            "Fast Wi-Fi",
            "Kitchen essentials",
            "Laundry access",
            "Onsite Parking ",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </section>

        <section className="enquiry section-band" id="enquiry">
          <div>
            <h2>Booking Enquiries</h2>
            <p>
              Have questions about dates, pricing, or amenities? We are here to
              help! No account required. Just share your email and a few details
              about your upcoming trip, and our team will follow up shortly with
              full property details and booking next steps.
            </p>
          </div>

          <form className="enquiry-form" onSubmit={handleEnquirySubmit}>
            <label>
              Name
              <Input name="name" autoComplete="name" placeholder="Your name" />
            </label>
            <label>
              Email
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            {/* <label>
              Stay Dates
              <Input name="dates" placeholder="Example: Aug 12-16" />
            </label> */}
            {/* <label>
              Guests
              <Input
                name="guests"
                type="number"
                min="1"
                placeholder="Number of guests"
              />
            </label> */}
            <label className="full-field">
              Details
              <TextArea
                name="message"
                rows={5}
                placeholder="Tell us about your trip, timing, questions, or any special requests."
              />
            </label>
            <Button
              className="button primary tamagui-submit"
              disabled={enquiryStatus === "saving"}
              type="submit"
            >
              {enquiryStatus === "saving" ? "Saving..." : "Send Enquiry"}
            </Button>
            {enquiryMessage ? (
              <p
                className={`form-status ${
                  enquiryStatus === "error" ? "is-error" : ""
                }`}
              >
                {enquiryMessage}
              </p>
            ) : null}
          </form>
        </section>
      </main>

      <footer className="site-footer" id="address">
        <p>Vintage Vineyard Estate</p>
        <address>1000 Vintage Dr, Oakley, CA 94561</address>
        <div className="footer-contact">
          <span>Contact Us On:</span>
          <a href="mailto:1000vintagepm@gmail.com">1000vintagepm@gmail.com</a>
          <a href="tel:+1234567890">+1 (925)-549-2107</a>
        </div>
      </footer>

      {galleryOpen ? (
        <GalleryModal onClose={() => setGalleryOpen(false)} />
      ) : null}
    </>
  );
}

function GalleryModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="gallery-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
    >
      <button
        className="gallery-modal-backdrop"
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
      />
      <section className="gallery gallery-modal-panel" id="gallery">
        <div className="gallery-modal-header">
          <div className="section-heading">
            <p className="section-kicker">Gallery</p>
            <h2 id="gallery-modal-title">
              Explore each space before you arrive.
            </h2>
          </div>
          <button
            className="gallery-modal-close"
            type="button"
            aria-label="Close gallery"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="gallery-sections">
          {gallerySections.map((section) => (
            <section className="gallery-room" key={section.title}>
              <div className="gallery-room-heading">
                <div>
                  <h3>{section.title}</h3>
                  <span>{section.images.length} photos</span>
                </div>
                <p>{section.copy}</p>
              </div>
              <ImageCarousel images={section.images} label={section.title} />
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function ImageCarousel({
  images,
  label,
}: {
  images: GalleryImage[];
  label: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  const showPrevious = () => {
    setCurrentIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  };

  const showNext = () => {
    setCurrentIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  };

  return (
    <div className="image-carousel" aria-label={`${label} image carousel`}>
      <figure key={`${label}-${currentIndex}`} className="carousel-slide">
        <img src={currentImage.image} alt={currentImage.alt} />
        <figcaption>{currentImage.title}</figcaption>
      </figure>

      {images.length > 1 ? (
        <>
          <button
            className="carousel-arrow carousel-arrow-left"
            type="button"
            aria-label={`Previous ${label} photo`}
            onClick={showPrevious}
          >
            ‹
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            type="button"
            aria-label={`Next ${label} photo`}
            onClick={showNext}
          >
            ›
          </button>
          <div className="carousel-count" aria-live="polite">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default App;

const pageStyles = `
:root {
  --ink: #242426;
  --muted: #68615c;
  --paper: #f8f4ee;
  --linen: #ece2d5;
  --moss: #52695a;
  --brick: #99463f;
  --gold: #bd8b4d;
  --white: #fffdfa;
  --shadow: 0 24px 70px rgba(36, 36, 38, 0.18);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
[id] { scroll-margin-top: 86px; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif;
  line-height: 1.5;
  overflow-x: hidden;
}
body.gallery-modal-open { overflow: hidden; }
img, video { display: block; width: 100%; height: 100%; object-fit: cover; }
a { color: inherit; text-decoration: none; }
button { font: inherit; }

.site-header {
  position: fixed;
  z-index: 20;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px clamp(20px, 5vw, 64px);
  color: var(--white);
  transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease;
}
.site-header.is-scrolled {
  background: rgba(248, 244, 238, 0.94);
  color: var(--ink);
  box-shadow: 0 10px 30px rgba(36, 36, 38, 0.08);
  backdrop-filter: blur(18px);
}
.brand {
  display: grid;
  min-width: 128px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.65rem;
  line-height: 0.9;
}
.brand small {
  margin-top: 6px;
  font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.site-nav {
  display: flex;
  align-items: center;
  gap: clamp(18px, 3vw, 40px);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.nav-cta { border: 1px solid currentColor; padding: 11px 17px; }
.nav-toggle { display: none; }

.hero {
  position: relative;
  min-height: 94vh;
  display: grid;
  align-items: end;
  overflow: hidden;
  color: var(--white);
}
.hero picture { position: absolute; inset: 0; }
.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(21, 22, 20, 0.76), rgba(21, 22, 20, 0.3) 58%, rgba(21, 22, 20, 0.1)),
    linear-gradient(0deg, rgba(21, 22, 20, 0.58), transparent 48%);
}
.hero-content {
  position: relative;
  z-index: 2;
  width: min(660px, calc(100% - 40px));
  padding-top: 34px;
  margin: 0 clamp(20px, 7vw, 96px) 116px;
}
.eyebrow, .section-kicker {
  margin: 0 0 18px;
  color: var(--gold);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
h1, h2, h3, p { margin-top: 0; }
h1, h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 400;
  line-height: 0.98;
}
h1 {
  max-width: 620px;
  margin-bottom: 20px;
  font-size: clamp(2.8rem, 6vw, 4.9rem);
  line-height: 0.96;
}
h2 {
  font-size: clamp(1.95rem, 3.4vw, 3.15rem);
  line-height: 1.04;
}
h3 {
  margin-bottom: 10px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.55rem;
  font-weight: 400;
}
.hero-content p:not(.eyebrow) {
  max-width: 560px;
  margin-bottom: 28px;
  font-size: clamp(1rem, 1.15vw, 1.15rem);
  line-height: 1.45;
}
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 0;
  padding: 11px 18px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.button.primary { background: var(--brick); color: var(--white); }
.button.ghost { border-color: rgba(255, 253, 250, 0.82); color: var(--white); }
.tamagui-submit { width: 100%; }
.hero-card {
  position: absolute;
  right: clamp(20px, 6vw, 86px);
  bottom: 28px;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: min(560px, calc(100% - 40px));
  padding-top: 14px;
  border-top: 1px solid rgba(255, 253, 250, 0.48);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.hero-card span:not(:last-child)::after {
  content: "/";
  margin-left: 10px;
  color: var(--gold);
}

.section-band { padding: clamp(70px, 9vw, 132px) clamp(20px, 7vw, 96px); }
.intro-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: clamp(28px, 6vw, 86px);
  align-items: start;
}
.intro p, .enquiry p { color: var(--muted); font-size: 1.08rem; }
.intro-copy {
  display: grid;
  gap: 16px;
}
.intro-copy p {
  margin-bottom: 0;
}
.property-highlights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.property-highlights span {
  display: flex;
  min-height: 54px;
  align-items: center;
  border-left: 3px solid var(--gold);
  padding: 12px 14px;
  background: rgba(255, 253, 250, 0.72);
  color: var(--ink);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.25;
  text-transform: uppercase;
}

.gallery { background: var(--white); }
.gallery-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: clamp(14px, 3vw, 34px);
}
.gallery-modal-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(20, 19, 18, 0.72);
  cursor: pointer;
}
.gallery-modal-panel {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  padding: clamp(22px, 4vw, 44px);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
}
.gallery-modal-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}
.gallery-modal-close {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(36, 36, 38, 0.18);
  background: var(--paper);
  color: var(--ink);
  cursor: pointer;
  font-size: 2rem;
  line-height: 1;
}
.gallery-modal-close:hover {
  background: var(--brick);
  color: var(--white);
}
.gallery .section-heading {
  grid-template-columns: 1fr;
  gap: 0;
}
.gallery .section-heading h2 {
  font-size: clamp(1.95rem, 3.4vw, 3.15rem);
  white-space: nowrap;
}
.section-heading {
  display: grid;
  grid-template-columns: 220px minmax(0, 840px);
  gap: 24px;
  align-items: start;
  margin-bottom: 28px;
}
.gallery-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.gallery-room {
  display: grid;
  grid-template-rows: minmax(74px, auto) auto;
  gap: 7px;
  min-width: 0;
}
.gallery-room-heading {
  display: grid;
  align-content: start;
  gap: 5px;
  min-height: 74px;
  border-bottom: 1px solid rgba(36, 36, 38, 0.14);
  padding-bottom: 6px;
}
.gallery-room-heading h3 {
  margin-bottom: 2px;
  font-size: clamp(1.05rem, 1.35vw, 1.28rem);
}
.gallery-room-heading span {
  color: var(--gold);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.gallery-room-heading p {
  max-width: 36ch;
  margin-bottom: 0;
  color: var(--muted);
  font-size: 0.76rem;
  line-height: 1.3;
}
.image-carousel {
  position: relative;
  width: 100%;
  aspect-ratio: 1.85 / 1;
  overflow: hidden;
  background: var(--paper);
  box-shadow: 0 12px 30px rgba(36, 36, 38, 0.1);
}
.carousel-slide {
  position: absolute;
  inset: 0;
  margin: 0;
  overflow: hidden;
  animation: carouselFade 260ms ease;
}
.carousel-slide img { transform: scale(1.001); }
.carousel-slide figcaption {
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  max-width: calc(100% - 88px);
  padding: 6px 9px;
  background: rgba(36, 36, 38, 0.72);
  color: var(--white);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 32px;
  height: 40px;
  place-items: center;
  border: 1px solid rgba(255, 253, 250, 0.58);
  background: rgba(36, 36, 38, 0.54);
  color: var(--white);
  cursor: pointer;
  font-size: 1.55rem;
  line-height: 1;
  transform: translateY(-50%);
  transition: background 160ms ease, transform 160ms ease;
}
.carousel-arrow:hover {
  background: rgba(153, 70, 63, 0.9);
  transform: translateY(-50%) scale(1.04);
}
.carousel-arrow-left { left: 8px; }
.carousel-arrow-right { right: 8px; }
.carousel-count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 2;
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 6px 9px;
  background: rgba(36, 36, 38, 0.72);
  color: var(--white);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
@keyframes carouselFade {
  from {
    opacity: 0;
    transform: translateX(12px) scale(1.01);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.amenities {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  background: rgba(36, 36, 38, 0.16);
}
.amenities span {
  display: grid;
  min-height: 96px;
  place-items: center;
  padding: 18px;
  background: var(--linen);
  color: var(--ink);
  text-align: center;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.enquiry {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(320px, 560px);
  gap: clamp(34px, 7vw, 90px);
  align-items: start;
  background: var(--linen);
}
.enquiry-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: clamp(22px, 4vw, 38px);
  background: var(--white);
  box-shadow: var(--shadow);
  min-width: 0;
}
.enquiry-form label {
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.full-field,
.enquiry-form .tamagui-submit {
  grid-column: 1 / -1;
}
.enquiry-form input,
.enquiry-form textarea,
.enquiry-form button {
  border-radius: 0;
}
.enquiry-form input,
.enquiry-form textarea {
  font-size: 0.95rem;
  line-height: 1.35;
}
.enquiry-form input::placeholder,
.enquiry-form textarea::placeholder {
  color: rgba(104, 97, 92, 0.72);
  font-size: 0.88rem;
  line-height: 1.3;
}
.enquiry-form input { min-height: 46px; }
.enquiry-form textarea { min-height: 128px; }
.bot-field {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.form-status {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--moss);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.form-status.is-error {
  color: var(--brick);
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 34px clamp(20px, 7vw, 96px);
  background: var(--ink);
  color: var(--white);
}
.site-footer p {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.25rem;
}
.site-footer address {
  margin: 0;
  color: #f1dfbd;
  font-style: normal;
}
.footer-contact {
  display: grid;
  gap: 4px;
}
.footer-contact span {
  color: var(--white);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.site-footer a { color: #f1dfbd; }

@media (max-width: 980px) {
  .site-nav { gap: 18px; letter-spacing: 0.1em; }
  .amenities { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .gallery-sections { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .gallery-sections {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .gallery-room {
    grid-template-rows: auto auto;
    gap: 8px;
  }
  .gallery-room-heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 12px;
    min-height: 0;
  }
  .gallery-room-heading p {
    display: none;
  }
  .image-carousel {
    aspect-ratio: 1.45 / 1;
  }
  .gallery .section-heading h2 {
    white-space: normal;
  }
}
@media (max-width: 900px) {
  .nav-toggle {
    position: relative;
    z-index: 22;
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
  }
  .nav-toggle span { width: 18px; height: 1px; background: currentColor; }
  .nav-toggle span + span { margin-top: -15px; }
  .site-nav {
    position: fixed;
    inset: 0 0 auto;
    z-index: 21;
    display: grid;
    gap: 0;
    padding: 96px 28px 30px;
    background: var(--paper);
    color: var(--ink);
    transform: translateY(-105%);
    transition: transform 180ms ease;
  }
  .site-nav.is-open { transform: translateY(0); }
  .site-nav a { border-top: 1px solid rgba(36, 36, 38, 0.14); padding: 17px 0; }
  .nav-cta { border-right: 0; border-left: 0; }
  .intro-grid, .section-heading, .enquiry { grid-template-columns: 1fr; }
  .enquiry-form { max-width: 640px; }
  .hero-content { max-width: 560px; }
}
@media (max-width: 640px) {
  .site-header { padding: 14px 16px; }
  .site-nav { padding: 84px 18px 24px; }
  .brand { font-size: 1.35rem; }
  .brand small { font-size: 0.54rem; letter-spacing: 0.14em; }
  .hero { min-height: 92svh; }
  .hero-content {
    width: calc(100% - 32px);
    padding-top: 18px;
    margin: 0 16px 118px;
  }
  h1 { font-size: clamp(2.25rem, 10.5vw, 3rem); max-width: 18ch; }
  h2 { font-size: 1.95rem; line-height: 1.08; }
  .hero-content p:not(.eyebrow) { font-size: 1rem; margin-bottom: 22px; }
  .hero-actions { flex-direction: column; align-items: flex-start; }
  .hero-actions .button { width: min(100%, 220px); min-width: 0; }
  .hero-card {
    left: 16px;
    right: 16px;
    bottom: 16px;
    font-size: 0.68rem;
  }
  .section-band { padding: 58px 18px; }
  .section-heading { margin-bottom: 22px; }
  .intro p, .enquiry p { font-size: 0.98rem; }
  .property-highlights { grid-template-columns: 1fr; }
  .property-highlights span {
    min-height: 48px;
    font-size: 0.76rem;
  }
  .gallery-sections { gap: 16px; }
  .gallery-modal {
    align-items: stretch;
    padding: 10px;
  }
  .gallery-modal-panel {
    max-height: calc(100svh - 20px);
    padding: 18px;
  }
  .gallery-modal-header {
    grid-template-columns: 1fr;
  }
  .gallery-modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
  }
  .gallery-modal-header .section-heading {
    padding-right: 50px;
  }
  .gallery-room-heading { grid-template-columns: 1fr; }
  .image-carousel { aspect-ratio: 1.25 / 1; }
  .carousel-arrow { width: 40px; height: 48px; font-size: 1.7rem; }
  .carousel-arrow-left { left: 10px; }
  .carousel-arrow-right { right: 10px; }
  .carousel-slide figcaption {
    min-height: 28px;
    max-width: calc(100% - 92px);
    font-size: 0.62rem;
  }
  .carousel-count {
    min-height: 28px;
    font-size: 0.62rem;
  }
  .amenities { grid-template-columns: 1fr 1fr; }
  .amenities span { min-height: 82px; padding: 14px; }
  .enquiry-form { grid-template-columns: 1fr; padding: 20px; }
  .enquiry-form input,
  .enquiry-form textarea { width: 100%; }
  .site-footer { display: grid; }
}
@media (max-width: 430px) {
  .site-header { padding: 12px 14px; }
  .brand { min-width: 0; font-size: 1.18rem; }
  .nav-toggle { width: 40px; height: 40px; }
  .hero-content {
    width: calc(100% - 28px);
    margin: 0 14px 126px;
  }
  h1 { font-size: 2.15rem; }
  h2 { font-size: 1.72rem; line-height: 1.08; }
  .eyebrow, .section-kicker {
    margin-bottom: 12px;
    font-size: 0.68rem;
    letter-spacing: 0.16em;
  }
  .button {
    width: 100%;
    padding-right: 14px;
    padding-left: 14px;
    letter-spacing: 0.1em;
  }
  .hero-actions { width: min(100%, 240px); }
  .hero-actions .button { width: 100%; }
  .hero-card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    padding-top: 10px;
    line-height: 1.25;
  }
  .hero-card span:not(:last-child)::after { display: none; }
  .section-band { padding: 50px 14px; }
  .gallery-sections { gap: 14px; }
  .image-carousel { aspect-ratio: 1.12 / 1; }
  .carousel-arrow { width: 38px; height: 46px; }
  .carousel-slide figcaption,
  .carousel-count {
    bottom: 8px;
    font-size: 0.58rem;
  }
  .carousel-slide figcaption { left: 8px; max-width: calc(100% - 82px); }
  .carousel-count { right: 8px; }
  .amenities { grid-template-columns: 1fr; }
  .amenities span { min-height: 64px; }
  .enquiry-form { padding: 16px; }
  .site-footer {
    padding: 28px 14px;
    font-size: 0.9rem;
  }
}
`;
