import { Config } from '@remotion/cli/config';

// PNG (lossless) frames: these compositions are flat-colour graphics, and JPEG
// quantisation bands/ringes on uniform areas (which also broke pixel asserts).
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
