"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

// Combined component for 404 page
export default function NotFoundPage() {
  return (
    <div className="w-full h-screen h-[100dvh] bg-black overflow-hidden flex justify-center items-center relative select-none">
      <MessageDisplay />
      <CharactersAnimation />
      <CircleAnimation />
    </div>
  );
}

// 1. Message Display Component
function MessageDisplay() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center w-full h-full z-[100] px-4 pointer-events-none">
      <div
        className={`flex flex-col items-center transition-opacity duration-700 ease-out pointer-events-auto ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="text-2xl sm:text-[35px] font-semibold text-black mb-1 text-center tracking-tight">
          Page Not Found
        </div>
        <div className="text-6xl sm:text-[80px] font-extrabold text-black mb-2 tracking-tight leading-none">
          404
        </div>
        <div className="text-xs sm:text-[15px] max-w-xs sm:max-w-md text-center text-neutral-800 mb-6 px-2 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 w-full sm:w-auto max-w-xs sm:max-w-none justify-center">
          <button
            type="button"
            onClick={handleGoBack}
            className="group text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 ease-in-out px-6 py-2.5 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
            <span>Go Back</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group bg-black text-white hover:bg-neutral-800 transition-all duration-300 ease-in-out px-6 py-2.5 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            <span>Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Characters Animation Component
type StickFigure = {
  top?: string;
  bottom?: string;
  src: string;
  transform?: string;
  speedX: number;
  speedRotation?: number;
};

function CharactersAnimation() {
  const charactersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define stick figures with their properties
    const stickFigures: StickFigure[] = [
      {
        top: "0%",
        src: "https://cdn.21st.dev/assets/mirror/54/54f366bdbf75b7a2d3b9f2264c3ada12aefcaf6e6a467bcecc856ffcd686e52e.svg",
        transform: "rotateZ(-90deg)",
        speedX: 1500,
      },
      {
        top: "10%",
        src: "https://cdn.21st.dev/assets/mirror/7e/7e48603d6fd3fac9720b25b4b6a06d107feea2d21ef8fa0720921808b9808514.svg",
        speedX: 3000,
        speedRotation: 2000,
      },
      {
        top: "20%",
        src: "https://cdn.21st.dev/assets/mirror/4f/4fd3a604a36cc8811c341ef3221010ed11e2563d4add29901922d7464c28c186.svg",
        speedX: 5000,
        speedRotation: 1000,
      },
      {
        top: "25%",
        src: "https://cdn.21st.dev/assets/mirror/54/54f366bdbf75b7a2d3b9f2264c3ada12aefcaf6e6a467bcecc856ffcd686e52e.svg",
        speedX: 2500,
        speedRotation: 1500,
      },
      {
        top: "35%",
        src: "https://cdn.21st.dev/assets/mirror/54/54f366bdbf75b7a2d3b9f2264c3ada12aefcaf6e6a467bcecc856ffcd686e52e.svg",
        speedX: 2000,
        speedRotation: 300,
      },
      {
        bottom: "5%",
        src: "https://cdn.21st.dev/assets/mirror/66/668d66f4c4d1dbc5c421692b4e5ad644c0f11f0327da214bcae21f78816c6b2f.svg",
        speedX: 0, // No horizontal movement
      },
    ];

    const container = charactersRef.current;
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    const isMobile = window.innerWidth < 640;
    const figureSize = isMobile ? "22%" : "16%";

    // Create and animate each stick figure
    stickFigures.forEach((figure, index) => {
      const stick = document.createElement("img");
      stick.classList.add("characters");
      stick.style.position = "absolute";
      stick.style.width = figureSize;
      stick.style.height = figureSize;
      stick.style.maxWidth = "140px";
      stick.style.maxHeight = "140px";
      stick.alt = "Animated figure";

      // Set position
      if (figure.top) stick.style.top = figure.top;
      if (figure.bottom) stick.style.bottom = figure.bottom;

      // Set image source
      stick.src = figure.src;

      // Set initial transform if specified
      if (figure.transform) stick.style.transform = figure.transform;

      // Append to the container
      container.appendChild(stick);

      // Skip animation for the last figure (index 5)
      if (index === 5) return;

      // Horizontal movement animation
      stick.animate(
        [{ left: "100%" }, { left: "-25%" }],
        { duration: figure.speedX, easing: "linear", fill: "forwards" }
      );

      // Skip rotation for the first figure (index 0)
      if (index === 0) return;

      // Rotation animation
      if (figure.speedRotation) {
        stick.animate(
          [{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }],
          { duration: figure.speedRotation, iterations: Infinity, easing: "linear" }
        );
      }
    });

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (charactersRef.current) {
        charactersRef.current.innerHTML = "";
        charactersRef.current.dispatchEvent(new Event("contentchanged"));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={charactersRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10"
    />
  );
}

// 3. Circle Animation Component
interface Circulo {
  x: number;
  y: number;
  size: number;
}

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | undefined>(undefined);
  const timerRef = useRef(0);
  const circulosRef = useRef<Circulo[]>([]);

  // Initialize circles array
  const initArr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    circulosRef.current = [];

    for (let index = 0; index < 300; index++) {
      const randomX =
        Math.floor(
          Math.random() * (canvas.width * 3 - canvas.width * 1.2 + 1)
        ) + canvas.width * 1.2;

      const randomY =
        Math.floor(
          Math.random() * (canvas.height - canvas.height * -0.2 + 1)
        ) + canvas.height * -0.2;

      const size = canvas.width / 1000;

      circulosRef.current.push({ x: randomX, y: randomY, size });
    }
  };

  // Drawing function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    timerRef.current++;
    context.setTransform(1, 0, 0, 1, 0, 0);

    const distanceX = canvas.width / 80;
    const growthRate = canvas.width / 1000;

    context.fillStyle = "white";
    context.clearRect(0, 0, canvas.width, canvas.height);

    circulosRef.current.forEach((circulo) => {
      context.beginPath();

      if (timerRef.current < 65) {
        circulo.x = circulo.x - distanceX;
        circulo.size = circulo.size + growthRate;
      }

      if (timerRef.current >= 65 && timerRef.current < 500) {
        circulo.x = circulo.x - distanceX * 0.02;
        circulo.size = circulo.size + growthRate * 0.2;
      }

      context.arc(circulo.x, circulo.y, Math.max(0, circulo.size), 0, Math.PI * 2);
      context.fill();
    });

    if (timerRef.current > 500) {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
      return;
    }

    requestIdRef.current = requestAnimationFrame(draw);
  };

  // Initialize canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize and start animation
    timerRef.current = 0;
    initArr();
    draw();

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      timerRef.current = 0;
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }

      const context = canvas.getContext("2d");
      if (context) {
        context.reset();
      }

      initArr();
      draw();
    };

    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
