import type { Preview } from "@storybook/react-vite";
import "../src/styles/global.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "dark", title: "Dark" },
          { value: "light", title: "Light" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "dark", viewport: { value: "phone", isRotated: false } },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      return <Story />;
    },
  ],
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    backgrounds: { disable: true },
    viewport: {
      options: {
        phone: { name: "Phone (390)", styles: { width: "390px", height: "844px" }, type: "mobile" },
        tablet: {
          name: "Tablet (820)",
          styles: { width: "820px", height: "1180px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop (1440)",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
      },
    },
  },
};

export default preview;
