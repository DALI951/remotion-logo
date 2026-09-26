// ChatGPT bloom intro — approved spec (2026-09-16).
//
// 2560x1440 @ 60fps, 600 frames (10s), black background, ChatGPT mint bloom.
//
//   frames   0-100  the bloom appears small and grows to half the screen
//                   (scale 0.28 -> 1, easeOut cubic)
//   frames 100-379  hold, dead centre
//   frames 200-559  accelerating spin: 0 -> 1440 deg, Easing.in(cubic)
//   frames 380-490  the six petals detach one by one, every 22 frames, and
//                   are thrown out of frame along (radial + 0.55 * spin tangent)
//   frame     599   empty: pure black
//
// The petal split is done with six wedge clipPaths over the SAME official path
// (no re-drawing of the geometry), so a detached petal is pixel-identical to
// the part of the bloom it came from.

import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ChatGPTBloom, CHATGPT_DRAWN, GPT_BLOOM } from './assets/logos';

const BG = '#000000';
const CX = 63.5;
const CY = 63.5;
const RADIUS = 95;
const ARM_OFFSET = 35.2; // degrees — first arm, the rest follow at +60 deg
const PETALS = 6;
const LAUNCH_FIRST = 380;
const LAUNCH_EVERY = 22;
const SPEED = 6; // svg units per frame
const TANGENT_BIAS = 0.55; // how much spin throws it vs. straight radial

const rad = (deg: number) => (deg * Math.PI) / 180;

const armAngle = (i: number) => ARM_OFFSET + 60 * i;

/** Wedge covering petal i: the arm's +/-30 deg sector. */
const wedgePath = (i: number) => {
  const a0 = rad(armAngle(i) - 30);
  const a1 = rad(armAngle(i) + 30);
  const x0 = CX + RADIUS * Math.cos(a0);
  const y0 = CY + RADIUS * Math.sin(a0);
  const x1 = CX + RADIUS * Math.cos(a1);
  const y1 = CY + RADIUS * Math.sin(a1);
  return `M ${CX} ${CY} L ${x0.toFixed(3)} ${y0.toFixed(3)} A ${RADIUS} ${RADIUS} 0 0 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`;
};

export const ChatGPTIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  // The drawn bloom is CHATGPT_DRAWN units wide inside a 127-unit box, so this
  // makes the LOGO (not the svg box) exactly 50% of the frame height.
  const size = height * 0.5 * (127 / CHATGPT_DRAWN);

  const appear = interpolate(frame, [0, 100], [0.28, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const spin = interpolate(frame, [200, 560], [0, 1440], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${appear})` }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 127 127"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {Array.from({ length: PETALS }, (_, i) => (
              <clipPath key={i} id={`wedge-${i}`}>
                <path d={wedgePath(i)} />
              </clipPath>
            ))}
          </defs>

          {Array.from({ length: PETALS }, (_, i) => {
            const launch = LAUNCH_FIRST + i * LAUNCH_EVERY;
            const flying = frame >= launch;
            const t = flying ? frame - launch : 0;

            // throw direction: radial + spin tangent
            const a = rad(armAngle(i));
            const rx = Math.cos(a);
            const ry = Math.sin(a);
            const tx = -ry;
            const ty = rx;
            let dx = rx + TANGENT_BIAS * tx;
            let dy = ry + TANGENT_BIAS * ty;
            const len = Math.hypot(dx, dy) || 1;
            dx /= len;
            dy /= len;

            const tx2 = flying ? dx * SPEED * t : 0;
            const ty2 = flying ? dy * SPEED * t : 0;
            // it keeps tumbling once it is loose
            const rot = flying ? spin + t * 10 : spin;

            return (
              <g
                key={i}
                clipPath={`url(#wedge-${i})`}
                transform={`translate(${tx2.toFixed(3)} ${ty2.toFixed(3)}) rotate(${rot.toFixed(3)} ${CX} ${CY})`}
              >
                <ChatGPTBloom size={127} fill={GPT_BLOOM} />
              </g>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
