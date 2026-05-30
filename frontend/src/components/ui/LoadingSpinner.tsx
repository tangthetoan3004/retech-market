import React from "react";

export default function LoadingSpinner() {
  return (
    <>
      <style>{`
        .custom-spinner {
          width: 64px;
          height: 64px;
          display: inline-block;
        }

        .custom-spinner svg {
          width: 100%;
          height: 100%;
        }

        .custom-track {
          stroke: #f5f5f5;
          stroke-width: 4;
          fill: none;
        }

        .ring-rotate {
          animation: ring-rotate 1.9s linear infinite;
          transform-origin: 50% 50%;
          transform-box: fill-box;
        }

        @keyframes ring-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .custom-arc-green {
          stroke: #6385e7;
          stroke-width: 4;
          stroke-linecap: round;
          fill: none;
          stroke-dasharray: 26.4 105.6;
          stroke-dashoffset: -77;
          animation: arc-poses-green 1.9s linear infinite;
        }

        .custom-arc-yellow {
          stroke: #ffcd38;
          stroke-width: 4;
          stroke-linecap: round;
          fill: none;
          stroke-dasharray: 26.4 105.6;
          stroke-dashoffset: -77;
          animation: arc-poses-yellow 1.9s linear infinite;
        }

        .custom-ring-yellow {
          animation-delay: 0.1s;
        }

        .custom-ring-green {
          animation-delay: 0s;
        }

        @keyframes arc-poses-green {
          0% {
            stroke-dasharray: 26.4 105.6;
            stroke-dashoffset: -77;
          }
          6.612% {
            stroke-dasharray: 10 122;
            stroke-dashoffset: -102;
          }
          31.65% {
            stroke-dasharray: 52.8 79.2;
            stroke-dashoffset: -85;
          }
          53.825% {
            stroke-dasharray: 39.6 92.4;
            stroke-dashoffset: -35;
          }
          82.95% {
            stroke-dasharray: 52.8 79.2;
            stroke-dashoffset: -300;
          }
          100% {
            stroke-dasharray: 26.4 105.6;
            stroke-dashoffset: -341;
          }
        }

        @keyframes arc-poses-yellow {
          0% {
            stroke-dasharray: 26.4 105.6;
            stroke-dashoffset: -77;
          }
          6.612% {
            stroke-dasharray: 10 122;
            stroke-dashoffset: -102;
          }
          31.65% {
            stroke-dasharray: 52.8 79.2;
            stroke-dashoffset: -100;
          }
          62% {
            stroke-dasharray: 39.6 92.4;
            stroke-dashoffset: -35;
          }
          82.95% {
            stroke-dasharray: 26.4 105.6;
            stroke-dashoffset: -300;
          }
          100% {
            stroke-dasharray: 26.4 105.6;
            stroke-dashoffset: -341;
          }
        }

        .custom-eye {
          fill: #ffcd38;
          pointer-events: none;
          transform-box: fill-box;
          transform-origin: center;
          translate: 0 0;
        }

        @keyframes eye-follow {
          0% {
            translate: 2.3px 0px;
            scale: 1 1;
          }
          10% {
            translate: 2.3px 0px;
            scale: 1 1;
          }
          20% {
            translate: 3.5px 2.8px;
            scale: 1 1;
          }
          35% {
            translate: -3.5px 5.5px;
            scale: 1 1.55;
          }
          50% {
            translate: -3.5px 2.0px;
            scale: 1.2 1.55;
          }
          75% {
            translate: 0px 0px;
            scale: 1.1 1.65;
          }
          100% {
            translate: 2.3px 0px;
            scale: 1 1;
          }
        }

        .custom-eye--blink {
          animation: eye-follow 1.9s linear infinite;
        }
      `}</style>

      <div className="custom-spinner" aria-hidden="true">
        <svg viewBox="0 0 50 50" role="img" focusable="false">
          <circle className="custom-track" cx="25" cy="25" r="21"></circle>
          <g className="ring-rotate custom-ring-yellow">
            <circle className="custom-arc-yellow" cx="25" cy="25" r="21"></circle>
          </g>
          <g className="ring-rotate custom-ring-green">
            <circle className="custom-arc-green" cx="25" cy="25" r="21"></circle>
          </g>

          <g className="eyes" aria-hidden="true">
            <circle className="custom-eye custom-eye--blink" cx="19.5" cy="21.5" r="2.2"></circle>
            <circle className="custom-eye custom-eye--blink" cx="30.5" cy="21.5" r="2.2"></circle>
          </g>
        </svg>
      </div>
    </>
  );
}
