import type { ExportAdapter } from "./adapter";
import { cssAdapter } from "./css";
import { jsonAdapter } from "./json";
import { tailwindAdapter } from "./tailwind";
import { shadcnAdapter } from "./shadcn";
import { bootstrapAdapter } from "./bootstrap";
import { muiAdapter } from "./mui";
import { antdAdapter } from "./antd";
import { chakraAdapter } from "./chakra";
import { figmaAdapter } from "./figma";
import { reactNativeAdapter } from "./react-native";
import { flutterAdapter } from "./flutter";
import { iosAdapter } from "./ios";
import { androidAdapter } from "./android";

export const EXPORT_ADAPTERS: ExportAdapter[] = [
  cssAdapter,
  jsonAdapter,
  tailwindAdapter,
  shadcnAdapter,
  bootstrapAdapter,
  muiAdapter,
  antdAdapter,
  chakraAdapter,
  figmaAdapter,
  reactNativeAdapter,
  flutterAdapter,
  iosAdapter,
  androidAdapter,
];

export {
  cssAdapter,
  jsonAdapter,
  tailwindAdapter,
  shadcnAdapter,
  bootstrapAdapter,
  muiAdapter,
  antdAdapter,
  chakraAdapter,
  figmaAdapter,
  reactNativeAdapter,
  flutterAdapter,
  iosAdapter,
  androidAdapter,
};
