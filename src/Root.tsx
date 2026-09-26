import React from 'react';
import { Composition } from 'remotion';
import { OpenCodeIntro } from './OpenCodeIntro';
import { ChatGPTIntro } from './ChatGPTIntro';

// 2560x1440 @ 60fps for both. Frames = seconds x 60.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="OpenCodeIntro"
      component={OpenCodeIntro}
      durationInFrames={480} // 8s
      fps={60}
      width={2560}
      height={1440}
    />
    <Composition
      id="ChatGPTIntro"
      component={ChatGPTIntro}
      durationInFrames={600} // 10s
      fps={60}
      width={2560}
      height={1440}
    />
  </>
);
