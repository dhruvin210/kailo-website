export type Product = {
  id: string;
  name: string;
  category: "Cases" | "Straps" | "Tuners" | "Picks" | "Cleaning Kits";
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  description: string;
  specs: { label: string; value: string }[];
  badge?: "NEW" | "SALE";
  stock: number;
};

import ukuleleCaseImg from "@/assets/products/ukulele-case.png";
import violinCaseImg from "@/assets/products/violin-case.png";
import leatherStrapImg from "@/assets/products/leather-strap.png";
import clipTunerImg from "@/assets/products/clip-tuner.png";
import pickSetImg from "@/assets/products/pick-set.png";
import cleaningKitImg from "@/assets/products/cleaning-kit.png";

export const formatINR = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const img = (q: string, sig: number) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=1200&q=80&sig=${sig}`;

export const PRODUCTS: Product[] = [
  {
    id: "ukulele-case",
    name: "Ukulele Hardshell Case",
    category: "Cases",
    price: 7499,
    rating: 4.8,
    reviews: 124,
    image: ukuleleCaseImg,
    images: [ukuleleCaseImg, img("photo-1510915361894-db8b60106cb1", 2)],
    description: "Plush-lined hardshell built around your soprano or concert uke. Reinforced corners and a velvet interior keep tone and finish pristine.",
    specs: [
      { label: "Material", value: "ABS shell, velvet lining" },
      { label: "Fits", value: "Soprano & concert" },
      { label: "Weight", value: "1.2 kg" },
    ],
    badge: "NEW",
    stock: 24,
  },
  {
    id: "guitar-case",
    name: "Acoustic Guitar Tweed Case",
    category: "Cases",
    price: 17999,
    rating: 4.9,
    reviews: 312,
    image: img("photo-1510915361894-db8b60106cb1", 3),
    images: [img("photo-1510915361894-db8b60106cb1", 3), img("photo-1493225457124-a3eb161ffa5f", 4)],
    description: "Vintage tweed exterior wrapped over a poplar shell. Built for the stage, made to age beautifully.",
    specs: [
      { label: "Material", value: "Tweed over poplar" },
      { label: "Fits", value: "Dreadnought & OM" },
      { label: "Weight", value: "3.4 kg" },
    ],
    stock: 12,
  },
  {
    id: "violin-case",
    name: "Violin Carbon Shell Case",
    category: "Cases",
    price: 28999,
    rating: 4.7,
    reviews: 87,
    image: violinCaseImg,
    images: [violinCaseImg],
    description: "Lightweight carbon-fibre shell with hygrometer and four-bow holder. Travel-ready.",
    specs: [
      { label: "Material", value: "Carbon composite" },
      { label: "Fits", value: "4/4 violin" },
      { label: "Weight", value: "1.9 kg" },
    ],
    stock: 8,
  },
  {
    id: "leather-strap",
    name: "Hand-Stitched Leather Guitar Strap",
    category: "Straps",
    price: 6499,
    rating: 4.9,
    reviews: 421,
    image: leatherStrapImg,
    images: [leatherStrapImg],
    description: "Full-grain vegetable-tanned leather, hand-stitched in our Nashville workshop.",
    specs: [
      { label: "Material", value: "Full-grain leather" },
      { label: "Length", value: "92–142 cm" },
      { label: "Width", value: "6.4 cm" },
    ],
    badge: "SALE",
    stock: 40,
  },
  {
    id: "neoprene-strap",
    name: "Neoprene Bass Strap",
    category: "Straps",
    price: 3999,
    rating: 4.6,
    reviews: 188,
    image: img("photo-1556449895-a33c9dba33dd", 7),
    images: [img("photo-1556449895-a33c9dba33dd", 7)],
    description: "Pressure-relieving neoprene cushion that floats heavy basses through long sets.",
    specs: [
      { label: "Material", value: "Neoprene + nylon" },
      { label: "Padding", value: "8 mm" },
      { label: "Length", value: "100–160 cm" },
    ],
    stock: 60,
  },
  {
    id: "woven-strap",
    name: "Woven Ukulele Strap",
    category: "Straps",
    price: 2499,
    rating: 4.7,
    reviews: 96,
    image: img("photo-1493225457124-a3eb161ffa5f", 8),
    images: [img("photo-1493225457124-a3eb161ffa5f", 8)],
    description: "Soft cotton weave with leather ends. Adjustable for sopranos through baritones.",
    specs: [
      { label: "Material", value: "Cotton weave" },
      { label: "Length", value: "80–120 cm" },
    ],
    stock: 100,
  },
  {
    id: "clip-tuner",
    name: "Clip-on Chromatic Tuner",
    category: "Tuners",
    price: 2999,
    rating: 4.8,
    reviews: 540,
    image: clipTunerImg,
    images: [clipTunerImg],
    description: "Full-colour display, 360° rotation, piezo-accurate to ±0.5 cents.",
    specs: [
      { label: "Range", value: "A0 – C8" },
      { label: "Accuracy", value: "±0.5 cents" },
      { label: "Battery", value: "CR2032" },
    ],
    stock: 75,
  },
  {
    id: "pedal-tuner",
    name: "Pedal Polyphonic Tuner",
    category: "Tuners",
    price: 10999,
    rating: 4.9,
    reviews: 233,
    image: img("photo-1607004468138-e7e23ea26947", 10),
    images: [img("photo-1607004468138-e7e23ea26947", 10)],
    description: "Tune all six strings at once. True bypass, silent muting, ultra-bright LEDs.",
    specs: [
      { label: "Type", value: "Polyphonic" },
      { label: "Bypass", value: "True bypass" },
      { label: "Power", value: "9V DC" },
    ],
    badge: "NEW",
    stock: 20,
  },
  {
    id: "pick-set",
    name: "Premium Pick Set (12)",
    category: "Picks",
    price: 1499,
    rating: 4.7,
    reviews: 612,
    image: pickSetImg,
    images: [pickSetImg],
    description: "Twelve picks across four gauges in a magnetic tin. Made from Delrin and tortoise-style acetal.",
    specs: [
      { label: "Count", value: "12 picks" },
      { label: "Gauges", value: ".60 / .73 / .88 / 1.0 mm" },
    ],
    stock: 200,
  },
  {
    id: "capo",
    name: "Brass Trigger Capo",
    category: "Picks",
    price: 2799,
    rating: 4.8,
    reviews: 178,
    image: img("photo-1471478331149-c72f17e33c73", 12),
    images: [img("photo-1471478331149-c72f17e33c73", 12)],
    description: "Solid brass trigger capo with silicone pad. Single-hand operation, no string bend.",
    specs: [
      { label: "Material", value: "Brass + silicone" },
      { label: "Fits", value: "6 & 12 string" },
    ],
    stock: 50,
  },
  {
    id: "string-kit",
    name: "String Cleaner Kit",
    category: "Cleaning Kits",
    price: 1999,
    rating: 4.6,
    reviews: 142,
    image: cleaningKitImg,
    images: [cleaningKitImg],
    description: "Microfibre cloth, string conditioner, fretboard oil. Doubles the life of your set.",
    specs: [
      { label: "Includes", value: "Cloth + 30ml conditioner + 15ml oil" },
    ],
    stock: 80,
  },
  {
    id: "polish-kit",
    name: "Polish & Care Kit",
    category: "Cleaning Kits",
    price: 2599,
    rating: 4.7,
    reviews: 109,
    image: img("photo-1574258495973-f010dfbb5371", 14),
    images: [img("photo-1574258495973-f010dfbb5371", 14)],
    description: "Gentle polish formulated for nitrocellulose, polyurethane and natural finishes.",
    specs: [
      { label: "Includes", value: "Polish 100ml + two cloths" },
    ],
    badge: "SALE",
    stock: 45,
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
export const CATEGORIES = ["All", "Cases", "Straps", "Tuners", "Picks", "Cleaning Kits"] as const;
